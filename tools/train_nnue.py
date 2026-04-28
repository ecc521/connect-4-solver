import os
import csv
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
import time

WIDTH = 7
HEIGHT = 6

class Connect4Dataset(Dataset):
    def __init__(self, data_files):
        keys = []
        labels_score = []
        labels_wdl = []
        
        print("Loading datasets...")
        for file in data_files:
            if not os.path.exists(file): continue
            print(f"Loading {file}...")
            with open(file, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    bb = int(row.get('key', row.get('bitboard_hash', 0)))
                    keys.append(bb)
                    score_val = 0
                    if 'score_val' in row:
                        val = int(row['score_val'])
                        if val in [1, 2]: score_val = -1
                        elif val in [4, 5]: score_val = 1
                    else:
                        score_val = int(row['score'])
                    
                    labels_score.append(score_val)
                    
                    if score_val > 0:
                        labels_wdl.append(1.0)
                    elif score_val < 0:
                        labels_wdl.append(0.0)
                    else:
                        labels_wdl.append(0.5)
                    
        print(f"Loaded {len(keys)} records. Decoding features...")
        import numpy as np
        features_np = np.zeros((len(keys), WIDTH * HEIGHT * 2), dtype=np.float32)
        
        for i, key in enumerate(keys):
            position = 0
            mask = 0
            for col in range(WIDTH):
                col_shift = col * (HEIGHT + 1)
                col_mask = ((1 << (HEIGHT + 1)) - 1)
                k_col = (key >> col_shift) & col_mask
                
                k_col_plus_1 = k_col + 1
                highest_bit = k_col_plus_1.bit_length() - 1
                
                pos_col = k_col_plus_1 - (1 << highest_bit)
                m_col = (1 << highest_bit) - 1
                
                position |= (pos_col << col_shift)
                mask |= (m_col << col_shift)
                
            opp = mask ^ position
            for c in range(WIDTH):
                for r in range(HEIGHT):
                    bit_idx = c * (HEIGHT + 1) + r
                    if (position >> bit_idx) & 1:
                        features_np[i, c * HEIGHT + r] = 1.0
                    elif (opp >> bit_idx) & 1:
                        features_np[i, WIDTH * HEIGHT + c * HEIGHT + r] = 1.0
                        
        self.features = torch.from_numpy(features_np)
        self.labels_score = torch.tensor(labels_score, dtype=torch.float32).unsqueeze(1)
        self.labels_wdl = torch.tensor(labels_wdl, dtype=torch.float32).unsqueeze(1)
        print("Feature decoding completed.")

    def __len__(self):
        return len(self.labels_score)

    def __getitem__(self, idx):
        return self.features[idx], self.labels_score[idx], self.labels_wdl[idx]

class ClippedReLU(nn.Module):
    def forward(self, x):
        return torch.clamp(x, 0.0, 1.0)

class NNUE(nn.Module):
    def __init__(self):
        super(NNUE, self).__init__()
        self.fc1 = nn.Linear(WIDTH * HEIGHT * 2, 256)
        self.relu = ClippedReLU()
        self.fc2 = nn.Linear(256, 1)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

def train():
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")

    full_dataset = Connect4Dataset(["../data/7x6_nnue_dataset_combined.csv"])
    
    val_size = int(0.2 * len(full_dataset))
    train_size = len(full_dataset) - val_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=4096, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=4096, shuffle=False)

    model = NNUE().to(device)
    mse_criterion = nn.MSELoss()
    bce_criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.002)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)

    epochs = 30
    best_val_loss = float('inf')
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        start_time = time.time()
        
        for batch_idx, (inputs, targets_score, targets_wdl) in enumerate(train_loader):
            inputs, targets_score, targets_wdl = inputs.to(device), targets_score.to(device), targets_wdl.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            
            loss_mse = mse_criterion(outputs, targets_score)
            loss_bce = bce_criterion(outputs / 4.0, targets_wdl)
            loss = 0.5 * loss_mse + 0.5 * loss_bce
            
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        avg_train_loss = total_loss / len(train_loader)
        
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for inputs, targets_score, targets_wdl in val_loader:
                inputs, targets_score, targets_wdl = inputs.to(device), targets_score.to(device), targets_wdl.to(device)
                outputs = model(inputs)
                
                loss_mse = mse_criterion(outputs, targets_score)
                loss_bce = bce_criterion(outputs / 4.0, targets_wdl)
                loss = 0.5 * loss_mse + 0.5 * loss_bce
                
                val_loss += loss.item()
                
        avg_val_loss = val_loss / len(val_loader)
        scheduler.step()
        
        print(f"Epoch {epoch+1:02d}/{epochs} | Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.5f} | Time: {time.time() - start_time:.1f}s")
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), "../data/nnue_7x6.pt")
            
    print("Training completed. Best Validation Blended Loss:", best_val_loss)

if __name__ == "__main__":
    train()
