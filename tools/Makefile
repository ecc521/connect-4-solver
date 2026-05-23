CXX := g++
CXXFLAGS := --std=c++17 -W -Wall -O3 -DNDEBUG -I../native -march=native -pthread

LDLIBS=
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	LDLIBS += -latomic
endif

SRCS=main.cpp generator.cpp pack_book.cpp pack_dense_book.cpp verify_book.cpp generate_nnue_data.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

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

