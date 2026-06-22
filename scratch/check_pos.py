def check_pos(pos, width, height):
    heights = [0] * width
    board = [[' ' for _ in range(width)] for _ in range(height)]
    for i, char in enumerate(pos):
        col = int(char) - 1
        row = heights[col]
        board[row][col] = 'X' if i % 2 == 0 else 'O'
        heights[col] += 1
        
        # Check for 4 in a row at this step
        player = board[row][col]
        # We only need to check lines containing (row, col)
        # Horizontal
        for c in range(max(0, col - 3), min(width - 3, col + 1)):
            if all(board[row][c+j] == player for j in range(4)):
                print(f"WIN at move {i+1} (player {'P1' if player == 'X' else 'P2'}): horizontal at row {row}, col {c}")
                return i+1
        # Vertical
        if row >= 3 and all(board[row-j][col] == player for j in range(4)):
            print(f"WIN at move {i+1} (player {'P1' if player == 'X' else 'P2'}): vertical at row {row-3}, col {col}")
            return i+1
        # Diagonal up-right
        for j in range(4):
            r, c = row - j, col - j
            if 0 <= r < height - 3 and 0 <= c < width - 3:
                if all(board[r+k][c+k] == player for k in range(4)):
                    print(f"WIN at move {i+1} (player {'P1' if player == 'X' else 'P2'}): diag up-right at row {r}, col {c}")
                    return i+1
        # Diagonal down-right
        for j in range(4):
            r, c = row + j, col - j
            if 3 <= r < height and 0 <= c < width - 3:
                if all(board[r-k][c+k] == player for k in range(4)):
                    print(f"WIN at move {i+1} (player {'P1' if player == 'X' else 'P2'}): diag down-right at row {r}, col {c}")
                    return i+1
    print("No winner found.")
    return None

pos = "776131711175487773663368571886844812211237328224441267748328744284468488623311722412636633"
check_pos(pos, 8, 13)
