"""
train_nnue.py — NNUE training on hybrid exact + soft-label datasets.

Accepts two types of .bin files:
  --exact  data_exact.bin  : 20 bytes/record: uint64 pos, uint64 opp, int16 score, int16 pad
                             score in [-32, +32] for 8x8. Normalized by dividing by MAX_SCORE.
  --soft   data_soft.bin   : 20 bytes/record: uint64 pos, uint64 opp, float32 score, int32 pad
                             score already normalized to [-1.0, +1.0].

Loss weighting: exact records receive 1.0x weight, soft records 0.3x weight.

Architecture variants (controlled by --hidden1 and --hidden2):
  S (default): 256 -> 32 -> 1  (~40K params)
  M:           512 -> 64 -> 1  (~140K params)
  L:          1024 -> 128 -> 1 (~530K params)
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, ConcatDataset, random_split
import numpy as np
import time
import argparse


# ── Datasets ──────────────────────────────────────────────────────────────────

class ExactDataset(Dataset):
    """Loads data_exact.bin: raw minimax scores in [-MAX_SCORE, +MAX_SCORE].

    Record format (40 bytes):
      uint64 pos_lo, uint64 pos_hi,  -- full 128-bit current-player bitboard
      uint64 opp_lo, uint64 opp_hi,  -- full 128-bit opponent bitboard
      int32 score, int32 padding
    """

    def __init__(self, files, width, height):
        dtype = np.dtype([
            ('pos_lo',  np.uint64),
            ('pos_hi',  np.uint64),
            ('opp_lo',  np.uint64),
            ('opp_hi',  np.uint64),
            ('score',   np.int32),   # raw minimax in [-MAX_SCORE, +MAX_SCORE]
            ('padding', np.int32),
        ])
        self.max_score = (width * height + 1) // 2  # e.g. 32 for 8x8

        all_data = []
        for f in files:
            if not os.path.exists(f):
                print(f"Warning: {f} not found, skipping.")
                continue
            print(f"Loading exact data: {f}...")
            all_data.append(np.fromfile(f, dtype=dtype))

        if not all_data:
            raise ValueError("No exact data files found.")

        data = np.concatenate(all_data)
        # Filter out any out-of-range records
        mask = (data['score'] >= -self.max_score) & (data['score'] <= self.max_score)
        data = data[mask]
        print(f"Exact: {len(data)} records (filtered {(~mask).sum()} outliers)")

        self.features = self._extract_features(
            data['pos_lo'], data['pos_hi'], data['opp_lo'], data['opp_hi'], width, height)
        raw = data['score'].astype(np.float32)
        self.labels   = torch.from_numpy(raw / self.max_score).unsqueeze(1)
        self.weights  = torch.ones(len(data), 1, dtype=torch.float32)  # 1.0x weight

    @staticmethod
    def _extract_features(pos_lo, pos_hi, opp_lo, opp_hi, width, height):
        """Extract binary features from split 128-bit bitboards.

        For 8x8, bit index = col * (height+1) + row. Bits 0-63 are in _lo,
        bits 64+ are in _hi.
        """
        col_bits = height + 1
        n = len(pos_lo)
        features = np.zeros((n, width * height * 2), dtype=np.float32)

        for col in range(width):
            for r in range(height):
                bit = col * col_bits + r
                if bit < 64:
                    features[:, col * height + r]                  = (pos_lo >> bit) & np.uint64(1)
                    features[:, width * height + col * height + r] = (opp_lo >> bit) & np.uint64(1)
                else:
                    b = np.uint64(bit - 64)
                    features[:, col * height + r]                  = (pos_hi >> b) & np.uint64(1)
                    features[:, width * height + col * height + r] = (opp_hi >> b) & np.uint64(1)

        return torch.from_numpy(features)

    def __len__(self): return len(self.labels)
    def __getitem__(self, idx): return self.features[idx], self.labels[idx], self.weights[idx]


class SoftDataset(Dataset):
    """Loads data_soft.bin: pre-normalized scores in [-1.0, +1.0].

    Record format (40 bytes):
      uint64 pos_lo, uint64 pos_hi,
      uint64 opp_lo, uint64 opp_hi,
      float32 score, int32 padding
    """

    def __init__(self, files, width, height, loss_weight=0.3):
        dtype = np.dtype([
            ('pos_lo',  np.uint64),
            ('pos_hi',  np.uint64),
            ('opp_lo',  np.uint64),
            ('opp_hi',  np.uint64),
            ('score',   np.float32), # pre-normalized to [-1.0, +1.0]
            ('padding', np.int32),
        ])

        all_data = []
        for f in files:
            if not os.path.exists(f):
                print(f"Warning: {f} not found, skipping.")
                continue
            print(f"Loading soft data: {f}...")
            all_data.append(np.fromfile(f, dtype=dtype))

        if not all_data:
            raise ValueError("No soft data files found.")

        data = np.concatenate(all_data)
        # Filter invalid normalized scores
        mask = (data['score'] >= -1.0) & (data['score'] <= 1.0)
        data = data[mask]
        print(f"Soft: {len(data)} records (filtered {(~mask).sum()} outliers)")

        self.features = ExactDataset._extract_features(
            data['pos_lo'], data['pos_hi'], data['opp_lo'], data['opp_hi'], width, height)
        self.labels   = torch.from_numpy(data['score'].copy()).unsqueeze(1)
        self.weights  = torch.full((len(data), 1), loss_weight, dtype=torch.float32)

    def __len__(self): return len(self.labels)
    def __getitem__(self, idx): return self.features[idx], self.labels[idx], self.weights[idx]



# ── Model ─────────────────────────────────────────────────────────────────────

class ClippedReLU(nn.Module):
    def forward(self, x): return torch.clamp(x, 0.0, 1.0)


class NNUE(nn.Module):
    """Configurable 2-layer NNUE: input -> H1 -> ClipReLU -> H2 -> ClipReLU -> 1."""

    def __init__(self, width, height, hidden1=256, hidden2=32):
        super().__init__()
        self.fc1   = nn.Linear(width * height * 2, hidden1)
        self.relu1 = ClippedReLU()
        self.fc2   = nn.Linear(hidden1, hidden2)
        self.relu2 = ClippedReLU()
        self.fc3   = nn.Linear(hidden2, 1)

    def forward(self, x):
        x = self.relu1(self.fc1(x))
        x = self.relu2(self.fc2(x))
        return self.fc3(x)


# ── Training ──────────────────────────────────────────────────────────────────

def train():
    parser = argparse.ArgumentParser()
    parser.add_argument("--width",      type=int, default=8)
    parser.add_argument("--height",     type=int, default=8)
    parser.add_argument("--exact",      type=str, default="",
                        help="Comma-separated list of data_exact.bin files")
    parser.add_argument("--soft",       type=str, default="",
                        help="Comma-separated list of data_soft.bin files")
    parser.add_argument("--soft-weight", type=float, default=0.3,
                        help="Loss weight for soft-label records (default 0.3)")
    parser.add_argument("--hidden1",    type=int, default=256,
                        help="Hidden layer 1 size (256=S, 512=M, 1024=L)")
    parser.add_argument("--hidden2",    type=int, default=32,
                        help="Hidden layer 2 size (32=S, 64=M, 128=L)")
    parser.add_argument("--output",     type=str, default="nnue_8x8.pt")
    parser.add_argument("--epochs",     type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=8192)
    parser.add_argument("--lr",         type=float, default=0.002)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else
                          "mps"  if torch.backends.mps.is_available() else "cpu")
    print(f"Device: {device}")

    datasets = []
    if args.exact:
        exact_files = [f.strip() for f in args.exact.split(",") if f.strip()]
        datasets.append(ExactDataset(exact_files, args.width, args.height))
    if args.soft:
        soft_files = [f.strip() for f in args.soft.split(",") if f.strip()]
        datasets.append(SoftDataset(soft_files, args.width, args.height, args.soft_weight))

    if not datasets:
        print("Error: provide at least one of --exact or --soft")
        return

    combined = ConcatDataset(datasets) if len(datasets) > 1 else datasets[0]
    print(f"Total records: {len(combined)}")

    val_size   = max(1, int(0.05 * len(combined)))
    train_size = len(combined) - val_size
    train_ds, val_ds = random_split(combined, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,
                              num_workers=4, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=args.batch_size, shuffle=False,
                              num_workers=2, pin_memory=True)

    n_params = args.hidden1 * args.width * args.height * 2 + args.hidden1 + \
               args.hidden2 * args.hidden1 + args.hidden2 + args.hidden2 + 1
    print(f"Architecture: {args.width*args.height*2} -> {args.hidden1} -> {args.hidden2} -> 1")
    print(f"Parameters  : ~{n_params:,}")

    model     = NNUE(args.width, args.height, args.hidden1, args.hidden2).to(device)
    criterion = nn.MSELoss(reduction='none')
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    max_score = (args.width * args.height + 1) // 2
    best_val  = float('inf')

    for epoch in range(args.epochs):
        model.train()
        train_loss = 0.0
        t0 = time.time()

        for feats, targets, weights in train_loader:
            feats, targets, weights = feats.to(device), targets.to(device), weights.to(device)
            optimizer.zero_grad()
            loss = (criterion(model(feats), targets) * weights).mean()
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        val_loss, correct, total = 0.0, 0, 0
        with torch.no_grad():
            for feats, targets, weights in val_loader:
                feats, targets, weights = feats.to(device), targets.to(device), weights.to(device)
                out = model(feats)
                val_loss += (criterion(out, targets) * weights).mean().item()
                THRESH = 1.0 / (2 * max_score)
                correct += (((out >  THRESH) & (targets >  THRESH)) |
                            ((out < -THRESH) & (targets < -THRESH)) |
                            ((out.abs() <= THRESH) & (targets.abs() <= THRESH))).sum().item()
                total += feats.size(0)

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
            print(f"  ✓ Saved to {args.output}  (WDL={accuracy:.1f}%)")

    print(f"\nBest val loss: {best_val:.6f}")


if __name__ == "__main__":
    train()
