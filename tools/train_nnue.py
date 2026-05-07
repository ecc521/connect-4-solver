"""
train_nnue.py — NNUE training on exact solver scores.

Target: exact minimax score in [-32, +32] for 8x8.
Loss:   MSE only. No BCE/WDL mixing.
Scale:  Raw integer score — no division by 200, no clipping.

Binary record format (20 bytes each):
  uint64 pos, uint64 opp, int16 search_score, int16 exact_wdl
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
import numpy as np
import time
import argparse


class Connect4Dataset(Dataset):
    def __init__(self, data_files, width, height):
        dtype = np.dtype([
            ('pos',          np.uint64),
            ('opp',          np.uint64),
            ('search_score', np.int16),
            ('exact_wdl',    np.int16),
        ])

        all_data = []
        for f in data_files:
            if not os.path.exists(f):
                print(f"Warning: {f} not found, skipping.")
                continue
            print(f"Loading {f}...")
            all_data.append(np.fromfile(f, dtype=dtype))

        if not all_data:
            raise ValueError("No data files found.")

        data = np.concatenate(all_data)

        # Filter: only keep records with exact scores in valid range
        exact = data['exact_wdl'].astype(np.int32)
        max_score = (width * height) // 2
        mask = (exact >= -max_score) & (exact <= max_score)
        data = data[mask]
        print(f"Loaded {len(data)} valid records (filtered {(~mask).sum()} heuristic-scale outliers).")

        # Features: 2 * W * H binary bits (current/opponent pieces)
        col_bits = height + 1
        n = len(data)
        features = np.zeros((n, width * height * 2), dtype=np.float32)
        pos_arr = data['pos']
        opp_arr = data['opp']
        for col in range(width):
            for r in range(height):
                bit = col * col_bits + r
                features[:, col * height + r]               = (pos_arr >> bit) & 1
                features[:, width * height + col * height + r] = (opp_arr >> bit) & 1

        self.features = torch.from_numpy(features)
        # Normalize targets to [-1, +1]: exact_score / MAX_SCORE
        # This is critical for fast convergence with ClippedReLU activations:
        # both activation outputs AND targets are on the same [-1, +1] scale.
        # The export SCALE is adjusted to map back to the C++ integer range.
        max_score = (width * height) // 2
        raw_labels = data['exact_wdl'].astype(np.float32)
        self.labels = torch.from_numpy(raw_labels / max_score).unsqueeze(1)
        print(f"Score distribution: min={data['exact_wdl'].min()}, "
              f"max={data['exact_wdl'].max()}, "
              f"mean={data['exact_wdl'].mean():.2f}")
        print(f"Normalized target range: [{(raw_labels/max_score).min():.3f}, {(raw_labels/max_score).max():.3f}]")

        # Compute sample weights to handle class imbalance
        is_win = raw_labels > 0
        is_loss = raw_labels < 0
        is_draw = raw_labels == 0
        n_win = is_win.sum()
        n_loss = is_loss.sum()
        n_draw = is_draw.sum()
        n_total = len(raw_labels)
        
        # Inverse frequency weights, bounded to avoid crazy spikes for very rare draws
        w_win = n_total / (3 * max(1, n_win))
        w_loss = n_total / (3 * max(1, n_loss))
        w_draw = min(10.0, n_total / (3 * max(1, n_draw))) # cap draw weight at 10x
        
        weights = np.zeros(n_total, dtype=np.float32)
        weights[is_win] = w_win
        weights[is_loss] = w_loss
        weights[is_draw] = w_draw
        self.weights = torch.from_numpy(weights).unsqueeze(1)

    def __len__(self): return len(self.labels)
    def __getitem__(self, idx): return self.features[idx], self.labels[idx], self.weights[idx]


class ClippedReLU(nn.Module):
    def forward(self, x): return torch.clamp(x, 0.0, 1.0)


class NNUE(nn.Module):
    """256 → ClipReLU → 32 → ClipReLU → 1 (linear output)."""
    def __init__(self, width, height):
        super().__init__()
        self.fc1   = nn.Linear(width * height * 2, 256)
        self.relu1 = ClippedReLU()
        self.fc2   = nn.Linear(256, 32)
        self.relu2 = ClippedReLU()
        self.fc3   = nn.Linear(32, 1)

    def forward(self, x):
        x = self.relu1(self.fc1(x))
        x = self.relu2(self.fc2(x))
        return self.fc3(x)


def train():
    parser = argparse.ArgumentParser()
    parser.add_argument("--width",      type=int, default=8)
    parser.add_argument("--height",     type=int, default=8)
    parser.add_argument("--input",      type=str, required=True,
                        help="Comma-separated list of .bin dataset files")
    parser.add_argument("--output",     type=str, default="nnue_model.pt")
    parser.add_argument("--epochs",     type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=8192)
    parser.add_argument("--lr",         type=float, default=0.002)
    args = parser.parse_args()

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Device: {device}")

    files = [f.strip() for f in args.input.split(",")]
    dataset = Connect4Dataset(files, args.width, args.height)

    val_size   = max(1, int(0.1 * len(dataset)))
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,  num_workers=4, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=args.batch_size, shuffle=False, num_workers=2, pin_memory=True)

    model     = NNUE(args.width, args.height).to(device)
    criterion = nn.MSELoss(reduction='none')
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    max_score = (args.width * args.height) // 2
    best_val  = float('inf')

    for epoch in range(args.epochs):
        model.train()
        train_loss = 0.0
        t0 = time.time()

        for feats, targets, weights in train_loader:
            feats, targets, weights = feats.to(device), targets.to(device), weights.to(device)
            optimizer.zero_grad()
            loss_unreduced = criterion(model(feats), targets)
            loss = (loss_unreduced * weights).mean()
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        # Validation: loss + WDL accuracy
        model.eval()
        val_loss, correct, total = 0.0, 0, 0
        with torch.no_grad():
            for feats, targets, weights in val_loader:
                feats, targets, weights = feats.to(device), targets.to(device), weights.to(device)
                out = model(feats)
                val_loss += (criterion(out, targets) * weights).mean().item()
                # Normalized targets: draw=0, smallest win/loss = ±1/32=0.03125
                THRESH = 1.0 / (2 * max_score)
                pred_win  = out > THRESH;  true_win  = targets > THRESH
                pred_loss = out < -THRESH; true_loss = targets < -THRESH
                pred_draw = (out.abs() <= THRESH); true_draw = (targets.abs() <= THRESH)
                correct += ((pred_win & true_win) | (pred_loss & true_loss) | (pred_draw & true_draw)).sum().item()
                total   += feats.size(0)

        avg_train = train_loss / len(train_loader)
        avg_val   = val_loss   / len(val_loader)
        accuracy  = 100.0 * correct / total
        scheduler.step()

        print(f"Epoch {epoch+1:02d}/{args.epochs} | "
              f"Train={avg_train:.4f} | Val={avg_val:.4f} | "
              f"WDL={accuracy:.1f}% | LR={optimizer.param_groups[0]['lr']:.6f} | "
              f"{time.time()-t0:.1f}s")

        if avg_val < best_val:
            best_val = avg_val
            torch.save(model.state_dict(), args.output)
            print(f"  ✓ Saved to {args.output}")


if __name__ == "__main__":
    train()
