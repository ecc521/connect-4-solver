CXX := g++
CXXFLAGS := --std=c++17 -W -Wall -O3 -DNDEBUG -I../native -march=native -pthread

LDLIBS=
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	LDLIBS += -latomic
endif

SRCS=main.cpp generator.cpp pack_book.cpp pack_dense_book.cpp verify_book.cpp generate_nnue_data.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

# Board-size-specific targets (compile with explicit -DBOARD_WIDTH/HEIGHT_MACRO=N)
# Usage: make build_strategy_book_WxH  e.g.  make build_strategy_book_8x8
build_strategy_book_%:
	$(eval DIMS := $(subst x, ,$*))
	$(eval BW := $(word 1,$(DIMS)))
	$(eval BH := $(word 2,$(DIMS)))
	$(CXX) $(CXXFLAGS) -DBOARD_WIDTH_MACRO=$(BW) -DBOARD_HEIGHT_MACRO=$(BH) \
	    -o build_strategy_book_$* build_strategy_book.cpp $(LDLIBS)

build-books: build_strategy_book_7x6 build_strategy_book_7x7 build_strategy_book_7x8
.PHONY: build-books

test_mutable_book:
	$(CXX) $(CXXFLAGS) -o test_mutable_book test_mutable_book.cpp $(LDLIBS)

test_book_depth_boundary:
	$(CXX) $(CXXFLAGS) -o test_book_depth_boundary test_book_depth_boundary.cpp $(LDLIBS)

test_collect_book_guard:
	$(CXX) $(CXXFLAGS) -o test_collect_book_guard test_collect_book_guard.cpp $(LDLIBS)

bench_book_lookup:
	$(CXX) $(CXXFLAGS) -o bench_book_lookup bench_book_lookup.cpp $(LDLIBS)

bench_collect:
	$(CXX) $(CXXFLAGS) -o bench_collect bench_collect.cpp $(LDLIBS)

bench_collect_mt:
	$(CXX) $(CXXFLAGS) -DUSE_PTHREADS -o bench_collect_mt bench_collect.cpp $(LDLIBS)

gen_depth12_book:
	$(CXX) $(CXXFLAGS) -o gen_depth12_book gen_depth12_book.cpp $(LDLIBS)

all: c4solver generator pack_book pack_dense_book verify_book generate_nnue_data

c4solver: main.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o c4solver main.o $(LDLIBS)

generator: generator.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o generator generator.o $(LDLIBS)

pack_book: pack_book.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o pack_book pack_book.o $(LDLIBS)

pack_dense_book: pack_dense_book.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o pack_dense_book pack_dense_book.o $(LDLIBS)

verify_book: verify_book.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o verify_book verify_book.o $(LDLIBS)

generate_nnue_data: generate_nnue_data.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o generate_nnue_data generate_nnue_data.o $(LDLIBS)



.depend: $(SRCS)
	$(CXX) $(CXXFLAGS) -MM $^ > ./.depend
	
-include .depend

clean:
	rm -f *.o ../native/*.o .depend c4solver generator pack_book pack_dense_book benchmark_book test_nps generate_nnue_data

