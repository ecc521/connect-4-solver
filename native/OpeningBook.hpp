/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef OPENING_BOOK_HPP
#define OPENING_BOOK_HPP

#include <iostream>
#include <fstream>
#include "Position.hpp"
#include <vector>
#include <algorithm>
#include <stdexcept>
#include <memory>
#include <cmath>

namespace GameSolver {
namespace Connect4 {

// ── Book format v2 ───────────────────────────────────────────────────────────
//
// On-disk header (18 bytes, all fields little-endian):
//
//   [0-1]  magic      0xC4 0x42   ("C4B" — fail loudly on wrong file)
//   [2]    version    0x02
//   [3]    width      board W
//   [4]    height     board H
//   [5]    depth      max ply stored (0–255)
//   [6]    flags      see FLAG_* constants below
//   [7]    align      in-a-row count (4 or 5)
//   [8]    key_bytes  key width in bytes for dense; 0 for EF
//   [9]    value_bytes 1 (Exact) or 2 (Bounded)
//   [10-17] num_entries  uint64_t LE
//
// flags byte:
//   bits 0-1: storage  00=Dense  01=Elias-Fano
//   bits 2-3: kind     00=Exact  10=Bounded
//   bit  4:   wrap     0=false   1=true
//   bits 5-7: reserved (0)
//
// Body (immediately after 18-byte header):
//
//   Dense:
//     keys   [num_entries × key_bytes, sorted ascending, LE]
//     values [num_entries × value_bytes]
//
//   Elias-Fano:
//     U           uint64_t LE   (universe size = max_key + 1)
//     L           uint8_t       (lower-bits width)
//     upper_bits  uint64_t[]    (EF upper bitvector)
//     lower_bits  uint64_t[]    (EF lower bitvector, omitted when L=0)
//     values      [num_entries × value_bytes]
//
// Value encoding (same for Exact and both bytes of Bounded):
//   stored_value = score - min_score(W, H) + 1
//   where min_score(W,H) = -((W*H+1)/2)
//   0 is the not-in-book sentinel — never a valid stored score.
//
// Bounded 2-byte layout:
//   byte 0 = lower bound (encoded)
//   byte 1 = upper bound (encoded)
//   [0, 0] = not in book
//   Both bytes are always ≥ 1 for a valid entry (the encoding guarantees this).
//   Upper byte = 0 with lower byte > 0 is used when loading Exact books
//   into the uint16_t value slot; query() treats this as lower == upper (exact).
//
// Note: 128-bit EF (for boards where W*(H+1) > 64) is not yet implemented.
// Dense format handles all key widths up to 16 bytes.
// ─────────────────────────────────────────────────────────────────────────────

static constexpr uint8_t BOOK_MAGIC_0   = 0xC4;
static constexpr uint8_t BOOK_MAGIC_1   = 0x42;
static constexpr uint8_t BOOK_VERSION   = 0x02;

static constexpr uint8_t FLAG_STORAGE_MASK  = 0x03;
static constexpr uint8_t FLAG_STORAGE_DENSE = 0x00;
static constexpr uint8_t FLAG_STORAGE_EF    = 0x01;
static constexpr uint8_t FLAG_KIND_MASK     = 0x0C;
static constexpr uint8_t FLAG_KIND_EXACT    = 0x00;
static constexpr uint8_t FLAG_KIND_BOUNDED  = 0x08;
static constexpr uint8_t FLAG_WRAP          = 0x10;

enum class BookKind : uint8_t { Exact = 0, Bounded = 2 };

// Result of a book lookup.
// lower == upper for Exact books; lower < upper for Bounded books.
// found() returns false (lower == 0) on a miss.
// Values are score-encoded: decode with  score = lower + min_score(W,H) - 1
struct BookLookup {
    int lower = 0;
    int upper = 0;
    bool found() const { return lower != 0; }
    bool isExact() const { return lower == upper; }
};

// ─────────────────────────────────────────────────────────────────────────────

#pragma pack(push, 1)
template<int W, int H, int N>
struct PackedKey {
    uint8_t data[N];

    using pos_t = typename GenericPosition<W, H>::position_t;

    operator pos_t() const {
        pos_t val = 0;
        for (int i = 0; i < N; i++) {
            val |= ((pos_t)data[i]) << (i * 8);
        }
        return val;
    }

    bool operator<(pos_t target) const {
        return static_cast<pos_t>(*this) < target;
    }

    bool operator==(pos_t target) const {
        return static_cast<pos_t>(*this) == target;
    }
};

template<int W, int H, int N>
bool operator<(typename GenericPosition<W, H>::position_t target, const PackedKey<W, H, N>& key) {
    return target < static_cast<typename GenericPosition<W, H>::position_t>(key);
}
#pragma pack(pop)

// ─────────────────────────────────────────────────────────────────────────────

template <int W, int H>
class OpeningBookBase {
public:
    using pos_t = typename GenericPosition<W, H>::position_t;
    // uint16_t value slot: low byte = lower (or exact), high byte = upper.
    // High byte == 0 means Exact (lower == upper). Value 0 == not in book.
    using EntryList = std::vector<std::pair<pos_t, uint16_t>>;

    virtual BookLookup query(const GenericPosition<W, H>& P) const = 0;
    virtual BookKind kind() const = 0;
    virtual int getDepth() const = 0;
    virtual EntryList dump() const = 0;
    virtual ~OpeningBookBase() = default;

    static std::unique_ptr<OpeningBookBase<W, H>> load(
        std::string filename, int width, int height, int align = 4, bool wrap = false);
    static std::unique_ptr<OpeningBookBase<W, H>> load(
        std::istream& ifs, int width, int height, size_t stream_size, int align = 4, bool wrap = false);
    static std::unique_ptr<OpeningBookBase<W, H>> load_from_memory(
        const uint8_t* data, size_t size, int width, int height, int align = 4, bool wrap = false);

    static void save_dense(
        const std::string& filename, int depth, EntryList items,
        BookKind bkind = BookKind::Exact, int align = 4, bool wrap = false);
    static void save_elias_fano(
        const std::string& filename, int depth, EntryList items,
        BookKind bkind = BookKind::Exact, int align = 4, bool wrap = false);

    static std::vector<uint8_t> serialize_dense(
        int depth, EntryList items,
        BookKind bkind = BookKind::Exact, int align = 4, bool wrap = false);
    static std::vector<uint8_t> serialize_elias_fano(
        int depth, EntryList items,
        BookKind bkind = BookKind::Exact, int align = 4, bool wrap = false);

protected:
    static BookLookup decodeVal(uint16_t v) {
        if (v == 0) return {0, 0};
        int lo = v & 0xFF;
        int hi = (v >> 8) & 0xFF;
        return {lo, hi ? hi : lo};
    }

    static uint8_t kindFlags(BookKind bkind) {
        return bkind == BookKind::Bounded ? FLAG_KIND_BOUNDED : FLAG_KIND_EXACT;
    }

    static uint8_t valueBytes(BookKind bkind) {
        return bkind == BookKind::Bounded ? 2 : 1;
    }

    static void writeHeader(std::vector<uint8_t>& buf,
                            uint8_t flags, int depth, int align, bool wrap,
                            uint8_t key_bytes, uint8_t val_bytes, uint64_t num_entries) {
        uint8_t header[18];
        header[0]  = BOOK_MAGIC_0;
        header[1]  = BOOK_MAGIC_1;
        header[2]  = BOOK_VERSION;
        header[3]  = (uint8_t)W;
        header[4]  = (uint8_t)H;
        header[5]  = (uint8_t)depth;
        header[6]  = flags | (wrap ? FLAG_WRAP : 0);
        header[7]  = (uint8_t)align;
        header[8]  = key_bytes;
        header[9]  = val_bytes;
        for (int i = 0; i < 8; i++) header[10 + i] = (uint8_t)(num_entries >> (i * 8));
        buf.insert(buf.end(), header, header + 18);
    }
};

// ─────────────────────────────────────────────────────────────────────────────

template <int W, int H>
class EliasFanoBook : public OpeningBookBase<W, H> {
    uint64_t num_entries;
    uint8_t L;
    int depth;
    BookKind _kind;
    std::vector<uint64_t> upper_bits;
    std::vector<uint64_t> lower_bits;
    std::vector<uint16_t> values;
    std::vector<uint32_t> block_counts;

    void build_index() {
        block_counts.assign(upper_bits.size() + 1, 0);
        uint32_t current = 0;
        for (size_t i = 0; i < upper_bits.size(); i++) {
            block_counts[i] = current;
            current += __builtin_popcountll(upper_bits[i]);
        }
        block_counts[upper_bits.size()] = current;
    }

    uint64_t select1(uint64_t rank) const {
        auto it = std::upper_bound(block_counts.begin(), block_counts.end(), (uint32_t)rank);
        size_t block_idx = std::distance(block_counts.begin(), it) - 1;

        uint64_t val = upper_bits[block_idx];
        uint32_t remaining = rank - block_counts[block_idx];

        while (val) {
            int bit_pos = __builtin_ctzll(val);
            if (remaining == 0) return block_idx * 64 + bit_pos;
            val &= val - 1;
            remaining--;
        }
        return block_idx * 64;
    }

    uint64_t get_key(uint64_t i) const {
        uint64_t y = select1(i) - i;
        return (y << L) | get_lower(i);
    }

    uint64_t get_lower(uint64_t i) const {
        if (L == 0) return 0;
        uint64_t bit_pos = i * L;
        uint64_t idx = bit_pos / 64;
        uint64_t shift = bit_pos % 64;
        uint64_t val = lower_bits.empty() ? 0 : lower_bits[idx] >> shift;
        if (shift + L > 64 && idx + 1 < lower_bits.size()) {
            val |= lower_bits[idx + 1] << (64 - shift);
        }
        return val & ((1ULL << L) - 1);
    }

    int getDepth() const override { return depth; }

public:
    EliasFanoBook(uint64_t n, uint64_t /*U*/, uint8_t L, int depth, BookKind kind,
                  std::vector<uint64_t> ub, std::vector<uint64_t> lb, std::vector<uint16_t> v)
        : num_entries{n}, L{L}, depth{depth}, _kind{kind},
          upper_bits(std::move(ub)), lower_bits(std::move(lb)), values(std::move(v)) {
        build_index();
    }

    BookKind kind() const override { return _kind; }

    BookLookup query(const GenericPosition<W, H>& P) const override {
        if (num_entries == 0 || P.nbMoves() > depth) return {0, 0};
        uint64_t x = (uint64_t)P.key3();

        uint64_t low = 0, high = num_entries;
        while (low < high) {
            uint64_t mid = low + (high - low) / 2;
            uint64_t mid_x = get_key(mid);
            if (mid_x < x)      low = mid + 1;
            else if (mid_x > x) high = mid;
            else                return OpeningBookBase<W,H>::decodeVal(values[mid]);
        }
        return {0, 0};
    }

    typename OpeningBookBase<W, H>::EntryList dump() const override {
        typename OpeningBookBase<W, H>::EntryList res;
        res.reserve(num_entries);

        uint64_t y = 0, i = 0;
        for (size_t block = 0; block < upper_bits.size(); block++) {
            uint64_t val = upper_bits[block];
            for (int bit = 0; bit < 64; bit++) {
                if (i >= num_entries) break;
                if ((val >> bit) & 1) {
                    res.push_back({
                        static_cast<typename GenericPosition<W, H>::position_t>((y << L) | get_lower(i)),
                        values[i]
                    });
                    i++;
                } else {
                    y++;
                }
            }
            if (i >= num_entries) break;
        }
        return res;
    }
};

// ─────────────────────────────────────────────────────────────────────────────

template<int W, int H, typename KeyT>
class DenseBook : public OpeningBookBase<W, H> {
    std::vector<KeyT> keys;
    std::vector<uint16_t> values;
    int depth;
    BookKind _kind;

    int getDepth() const override { return depth; }

public:
    DenseBook(int depth, BookKind kind, std::vector<KeyT> k, std::vector<uint16_t> v)
        : keys(std::move(k)), values(std::move(v)), depth{depth}, _kind{kind} {}

    DenseBook() : depth(-1), _kind{BookKind::Exact} {}

    BookKind kind() const override { return _kind; }

    BookLookup query(const GenericPosition<W, H>& P) const override {
        if (keys.empty() || P.nbMoves() > depth) return {0, 0};

        typename GenericPosition<W, H>::position_t target = P.key3();

        if constexpr (sizeof(KeyT) < sizeof(target)) {
            target &= (typename GenericPosition<W, H>::position_t(1) << (sizeof(KeyT) * 8)) - 1;
        }

        auto it = std::lower_bound(keys.begin(), keys.end(), target);
        if (it != keys.end() && *it == target) {
            return OpeningBookBase<W,H>::decodeVal(values[std::distance(keys.begin(), it)]);
        }
        return {0, 0};
    }

    typename OpeningBookBase<W, H>::EntryList dump() const override {
        typename OpeningBookBase<W, H>::EntryList res;
        res.reserve(keys.size());
        for (size_t i = 0; i < keys.size(); i++) {
            res.push_back({
                static_cast<typename GenericPosition<W, H>::position_t>(keys[i]),
                values[i]
            });
        }
        return res;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Loaders (private helpers)

template<int W, int H, int N>
std::unique_ptr<OpeningBookBase<W, H>> load_dense_book_n(
        std::istream& ifs, uint64_t num_entries, int depth, BookKind kind, uint8_t val_bytes) {
    std::vector<PackedKey<W, H, N>> keys(num_entries);
    std::vector<uint16_t> values(num_entries, 0);

    if (num_entries > 0) {
        ifs.read(reinterpret_cast<char*>(keys.data()), num_entries * N);
        if (val_bytes == 2) {
            for (uint64_t i = 0; i < num_entries; i++) {
                uint8_t lo, hi;
                ifs.read(reinterpret_cast<char*>(&lo), 1);
                ifs.read(reinterpret_cast<char*>(&hi), 1);
                values[i] = (uint16_t)lo | ((uint16_t)hi << 8);
            }
        } else {
            for (uint64_t i = 0; i < num_entries; i++) {
                uint8_t v;
                ifs.read(reinterpret_cast<char*>(&v), 1);
                values[i] = v;
            }
        }
        if (ifs.fail()) throw std::runtime_error("Failed to read Dense book data.");
    }
    return std::make_unique<DenseBook<W, H, PackedKey<W, H, N>>>(depth, kind, std::move(keys), std::move(values));
}

template<int W, int H>
std::unique_ptr<OpeningBookBase<W, H>> load_elias_fano_book(
        std::istream& ifs, uint64_t num_entries, int depth, BookKind kind, uint8_t val_bytes) {
    uint64_t U;
    uint8_t L;
    ifs.read(reinterpret_cast<char*>(&U), 8);
    ifs.read(reinterpret_cast<char*>(&L), 1);

    uint64_t upper_bits_size = (num_entries + (U >> L) + 64) / 64;
    uint64_t lower_bits_size = L > 0 ? (num_entries * L + 63) / 64 : 0;

    std::vector<uint64_t> upper_bits(upper_bits_size);
    std::vector<uint64_t> lower_bits(lower_bits_size);
    std::vector<uint16_t> values(num_entries, 0);

    ifs.read(reinterpret_cast<char*>(upper_bits.data()), upper_bits_size * 8);
    if (lower_bits_size > 0)
        ifs.read(reinterpret_cast<char*>(lower_bits.data()), lower_bits_size * 8);

    if (val_bytes == 2) {
        for (uint64_t i = 0; i < num_entries; i++) {
            uint8_t lo, hi;
            ifs.read(reinterpret_cast<char*>(&lo), 1);
            ifs.read(reinterpret_cast<char*>(&hi), 1);
            values[i] = (uint16_t)lo | ((uint16_t)hi << 8);
        }
    } else {
        for (uint64_t i = 0; i < num_entries; i++) {
            uint8_t v;
            ifs.read(reinterpret_cast<char*>(&v), 1);
            values[i] = v;
        }
    }

    if (ifs.fail()) throw std::runtime_error("Failed to read Elias-Fano book data.");

    return std::make_unique<EliasFanoBook<W, H>>(
        num_entries, U, L, depth, kind,
        std::move(upper_bits), std::move(lower_bits), std::move(values));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public load entry points

template<int W, int H>
inline std::unique_ptr<OpeningBookBase<W, H>> OpeningBookBase<W, H>::load(
        std::string filename, int width, int height, int align, bool wrap) {
    std::ifstream ifs(filename, std::ios::binary);
    if (ifs.fail()) throw std::runtime_error("Failed to open book file: " + filename);
    ifs.seekg(0, std::ios::end);
    size_t file_size = ifs.tellg();
    ifs.seekg(0, std::ios::beg);
    return load(ifs, width, height, file_size, align, wrap);
}

struct MemBuf : std::streambuf {
    MemBuf(char* begin, char* end) { this->setg(begin, begin, end); }
};

template<int W, int H>
inline std::unique_ptr<OpeningBookBase<W, H>> OpeningBookBase<W, H>::load_from_memory(
        const uint8_t* data, size_t size, int width, int height, int align, bool wrap) {
    MemBuf sbuf(const_cast<char*>(reinterpret_cast<const char*>(data)),
                const_cast<char*>(reinterpret_cast<const char*>(data)) + size);
    std::istream is(&sbuf);
    return load(is, width, height, size, align, wrap);
}

template<int W, int H>
inline std::unique_ptr<OpeningBookBase<W, H>> OpeningBookBase<W, H>::load(
        std::istream& ifs, int width, int height, size_t /*stream_size*/, int align, bool wrap) {
    uint8_t hdr[18];
    ifs.read(reinterpret_cast<char*>(hdr), 18);
    if (ifs.fail()) throw std::runtime_error("Failed to read book header.");

    if (hdr[0] != BOOK_MAGIC_0 || hdr[1] != BOOK_MAGIC_1)
        throw std::runtime_error("Not a v2 book file (wrong magic bytes). Run the book converter first.");

    if (hdr[2] != BOOK_VERSION)
        throw std::runtime_error("Unsupported book version " + std::to_string(hdr[2]) + " (expected " + std::to_string(BOOK_VERSION) + ").");

    int file_w    = hdr[3];
    int file_h    = hdr[4];
    int depth     = hdr[5];
    uint8_t flags = hdr[6];
    int file_align = hdr[7];
    uint8_t key_bytes  = hdr[8];
    uint8_t val_bytes  = hdr[9];
    uint64_t num_entries = 0;
    for (int i = 0; i < 8; i++) num_entries |= (uint64_t)hdr[10 + i] << (i * 8);

    if (file_w != width || file_h != height)
        throw std::runtime_error("Book dimensions " + std::to_string(file_w) + "x" + std::to_string(file_h) +
                                 " do not match solver " + std::to_string(width) + "x" + std::to_string(height) + ".");

    if (file_align != align)
        throw std::runtime_error("Book align=" + std::to_string(file_align) + " does not match solver align=" + std::to_string(align) + ".");

    bool file_wrap = (flags & FLAG_WRAP) != 0;
    if (file_wrap != wrap)
        throw std::runtime_error("Book wrap flag does not match solver.");

    if (val_bytes != 1 && val_bytes != 2)
        throw std::runtime_error("Unsupported value_bytes=" + std::to_string(val_bytes) + ".");

    uint8_t kind_bits = flags & FLAG_KIND_MASK;
    BookKind kind;
    if      (kind_bits == FLAG_KIND_EXACT)   kind = BookKind::Exact;
    else if (kind_bits == FLAG_KIND_BOUNDED) kind = BookKind::Bounded;
    else throw std::runtime_error("Unknown book kind bits: " + std::to_string(kind_bits) + ".");

    uint8_t storage = flags & FLAG_STORAGE_MASK;
    if (storage == FLAG_STORAGE_EF) {
        return load_elias_fano_book<W, H>(ifs, num_entries, depth, kind, val_bytes);
    }

    // Dense: dispatch on key_bytes
    switch (key_bytes) {
        case 1:  return load_dense_book_n<W, H, 1> (ifs, num_entries, depth, kind, val_bytes);
        case 2:  return load_dense_book_n<W, H, 2> (ifs, num_entries, depth, kind, val_bytes);
        case 3:  return load_dense_book_n<W, H, 3> (ifs, num_entries, depth, kind, val_bytes);
        case 4:  return load_dense_book_n<W, H, 4> (ifs, num_entries, depth, kind, val_bytes);
        case 5:  return load_dense_book_n<W, H, 5> (ifs, num_entries, depth, kind, val_bytes);
        case 6:  return load_dense_book_n<W, H, 6> (ifs, num_entries, depth, kind, val_bytes);
        case 7:  return load_dense_book_n<W, H, 7> (ifs, num_entries, depth, kind, val_bytes);
        case 8:  return load_dense_book_n<W, H, 8> (ifs, num_entries, depth, kind, val_bytes);
        case 9:  return load_dense_book_n<W, H, 9> (ifs, num_entries, depth, kind, val_bytes);
        case 10: return load_dense_book_n<W, H, 10>(ifs, num_entries, depth, kind, val_bytes);
        case 11: return load_dense_book_n<W, H, 11>(ifs, num_entries, depth, kind, val_bytes);
        case 12: return load_dense_book_n<W, H, 12>(ifs, num_entries, depth, kind, val_bytes);
        case 13: return load_dense_book_n<W, H, 13>(ifs, num_entries, depth, kind, val_bytes);
        case 14: return load_dense_book_n<W, H, 14>(ifs, num_entries, depth, kind, val_bytes);
        case 15: return load_dense_book_n<W, H, 15>(ifs, num_entries, depth, kind, val_bytes);
        case 16: return load_dense_book_n<W, H, 16>(ifs, num_entries, depth, kind, val_bytes);
        default: throw std::runtime_error("Unsupported key_bytes=" + std::to_string(key_bytes) + " in dense book.");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Serializers

template<int W, int H>
inline std::vector<uint8_t> OpeningBookBase<W, H>::serialize_dense(
        int depth, EntryList items, BookKind bkind, int align, bool wrap) {
    std::sort(items.begin(), items.end());
    items.erase(std::unique(items.begin(), items.end(),
        [](const auto& a, const auto& b) { return a.first == b.first; }), items.end());

    uint8_t val_bytes = valueBytes(bkind);

    pos_t max_key_val = 0;
    for (const auto& item : items) if (item.first > max_key_val) max_key_val = item.first;

    int key_bytes = std::max(1, (int)std::ceil(std::log2((double)max_key_val + 2) / 8.0));
    while (key_bytes < 16) {
        bool fits = true;
        if constexpr (sizeof(pos_t) > 8) {
            if ((max_key_val >> (key_bytes * 8)) > 0) fits = false;
        } else {
            if (key_bytes < 8 && (max_key_val >> (key_bytes * 8)) > 0) fits = false;
        }
        if (fits) break;
        key_bytes++;
    }
    if (key_bytes > 16) key_bytes = 16;

    std::vector<uint8_t> buf;
    uint8_t flags = FLAG_STORAGE_DENSE | kindFlags(bkind);
    writeHeader(buf, flags, depth, align, wrap, (uint8_t)key_bytes, val_bytes, items.size());

    for (const auto& item : items) {
        pos_t key = item.first;
        for (int b = 0; b < key_bytes; b++)
            buf.push_back((uint8_t)((key >> (b * 8)) & 0xFF));
    }
    for (const auto& item : items) {
        buf.push_back((uint8_t)(item.second & 0xFF));
        if (val_bytes == 2) buf.push_back((uint8_t)((item.second >> 8) & 0xFF));
    }
    return buf;
}

template<int W, int H>
inline std::vector<uint8_t> OpeningBookBase<W, H>::serialize_elias_fano(
        int depth, EntryList items, BookKind bkind, int align, bool wrap) {
    std::sort(items.begin(), items.end());
    items.erase(std::unique(items.begin(), items.end(),
        [](const auto& a, const auto& b) { return a.first == b.first; }), items.end());

    uint8_t val_bytes = valueBytes(bkind);
    uint64_t n = items.size();
    pos_t max_key_val = n > 0 ? items.back().first : 0;

    if constexpr (sizeof(pos_t) > 8) {
        if (max_key_val >> 64)
            throw std::runtime_error(
                "Elias-Fano: keys exceed 64-bit range for this board size. "
                "Use dense format instead (128-bit EF not yet implemented).");
    }

    uint64_t U = static_cast<uint64_t>(max_key_val) + 1;
    uint8_t L = n > 0 ? (uint8_t)std::max(0, (int)std::floor(std::log2((double)U / n))) : 0;

    std::vector<uint8_t> buf;
    uint8_t flags = FLAG_STORAGE_EF | kindFlags(bkind);
    writeHeader(buf, flags, depth, align, wrap, 0, val_bytes, n);

    // EF sub-header: U (8 bytes) + L (1 byte)
    for (int i = 0; i < 8; i++) buf.push_back((uint8_t)(U >> (i * 8)));
    buf.push_back(L);

    uint64_t ub_size = (n + (U >> L) + 64) / 64;
    std::vector<uint64_t> ub(ub_size, 0);
    for (size_t i = 0; i < n; i++) {
        uint64_t y = items[i].first >> L;
        ub[(y + i) / 64] |= (1ULL << ((y + i) % 64));
    }
    for (uint64_t w64 : ub)
        for (int b = 0; b < 8; b++) buf.push_back((uint8_t)(w64 >> (b * 8)));

    uint64_t lb_size = L > 0 ? (n * L + 63) / 64 : 0;
    std::vector<uint64_t> lb(lb_size, 0);
    for (size_t i = 0; i < n; i++) {
        if (L == 0) continue;
        uint64_t val = items[i].first & ((1ULL << L) - 1);
        uint64_t bit_pos = i * L;
        uint64_t idx = bit_pos / 64;
        uint64_t shift = bit_pos % 64;
        lb[idx] |= (val << shift);
        if (shift + L > 64 && idx + 1 < lb_size) lb[idx + 1] |= (val >> (64 - shift));
    }
    for (uint64_t w64 : lb)
        for (int b = 0; b < 8; b++) buf.push_back((uint8_t)(w64 >> (b * 8)));

    for (const auto& item : items) {
        buf.push_back((uint8_t)(item.second & 0xFF));
        if (val_bytes == 2) buf.push_back((uint8_t)((item.second >> 8) & 0xFF));
    }
    return buf;
}

template<int W, int H>
inline void OpeningBookBase<W, H>::save_dense(
        const std::string& filename, int depth, EntryList items,
        BookKind bkind, int align, bool wrap) {
    auto buf = serialize_dense(depth, std::move(items), bkind, align, wrap);
    std::ofstream ofs(filename, std::ios::binary);
    if (ofs.fail()) throw std::runtime_error("Failed to open book file for writing: " + filename);
    ofs.write(reinterpret_cast<const char*>(buf.data()), buf.size());
}

template<int W, int H>
inline void OpeningBookBase<W, H>::save_elias_fano(
        const std::string& filename, int depth, EntryList items,
        BookKind bkind, int align, bool wrap) {
    auto buf = serialize_elias_fano(depth, std::move(items), bkind, align, wrap);
    std::ofstream ofs(filename, std::ios::binary);
    if (ofs.fail()) throw std::runtime_error("Failed to open book file for writing: " + filename);
    ofs.write(reinterpret_cast<const char*>(buf.data()), buf.size());
}

} // namespace Connect4
} // namespace GameSolver

#endif
