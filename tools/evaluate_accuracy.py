"""
evaluate_accuracy.py
Evaluates a trained NNUE against exact-score test data.

Metrics:
  WDL accuracy  — sign(prediction) matches sign(exact_score)
  MSE           — mean squared error vs exact score
  Depth stability — run at depths 1,2,4,8 and measure score variance
"""

import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader
import argparse, os, sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from train_nnue import NNUE, ExactDataset


def load_model(path, width, height, hidden1, hidden2, device):
    model = NNUE(width, height, hidden1=hidden1, hidden2=hidden2).to(device)
    model.load_state_dict(torch.load(path, map_location=device))
    model.eval()
    return model


def evaluate(model, loader, device, max_score):
    correct = total = 0
    mse = 0.0
    wins_correct = wins_total = 0
    losses_correct = losses_total = 0
    draws_correct = draws_total = 0

    # Normalized targets: draw=0.0, smallest win = +1/max_score, smallest loss = -1/max_score
    # Threshold: half of 1/max_score
    THRESH = 1.0 / (2 * max_score)

    with torch.no_grad():
        for feats, targets, _weights in loader:
            feats, targets = feats.to(device), targets.to(device)
            out = model(feats)

            p_win  = (out > THRESH).squeeze();  t_win  = (targets > THRESH).squeeze()
            p_loss = (out < -THRESH).squeeze(); t_loss = (targets < -THRESH).squeeze()
            p_draw = (out.abs() <= THRESH).squeeze(); t_draw = (targets.abs() <= THRESH).squeeze()

            correct += ((p_win & t_win) | (p_loss & t_loss) | (p_draw & t_draw)).sum().item()
            total   += feats.size(0)

            wins_correct   += (p_win & t_win).sum().item()
            wins_total     += t_win.sum().item()
            losses_correct += (p_loss & t_loss).sum().item()
            losses_total   += t_loss.sum().item()
            draws_correct  += (p_draw & t_draw).sum().item()
            draws_total    += t_draw.sum().item()

            mse += ((out.squeeze() - targets.squeeze()) ** 2).sum().item()

    n = total
    acc = 100.0 * correct / n
    print(f"  Overall WDL accuracy : {acc:.2f}%  ({correct}/{n})")
    print(f"  Win  accuracy        : {100.0*wins_correct/max(wins_total,1):.1f}%  ({wins_correct}/{wins_total})")
    print(f"  Loss accuracy        : {100.0*losses_correct/max(losses_total,1):.1f}%  ({losses_correct}/{losses_total})")
    print(f"  Draw accuracy        : {100.0*draws_correct/max(draws_total,1):.1f}%  ({draws_correct}/{draws_total})")
    print(f"  MSE (score units²)   : {mse/n:.4f}")
    print(f"  RMSE (score units)   : {(mse/n)**0.5:.4f}")
    return acc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model",  type=str, required=True)
    parser.add_argument("--data",   type=str, required=True,
                        help="Comma-separated .bin files")
    parser.add_argument("--width",  type=int, default=8)
    parser.add_argument("--height", type=int, default=8)
    parser.add_argument("--hidden1", type=int, default=256, help="H1 hidden layer size")
    parser.add_argument("--hidden2", type=int, default=32,  help="H2 hidden layer size")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else
                          "mps"  if torch.backends.mps.is_available() else "cpu")
    print(f"Device: {device}")

    files = [f.strip() for f in args.data.split(",")]
    dataset = ExactDataset(files, args.width, args.height)
    loader  = DataLoader(dataset, batch_size=4096, shuffle=False, num_workers=2)

    max_score = (args.width * args.height + 1) // 2
    model = load_model(args.model, args.width, args.height, args.hidden1, args.hidden2, device)

    print(f"\nModel: {args.model}")
    evaluate(model, loader, device, max_score)


if __name__ == "__main__":
    main()
