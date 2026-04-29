CXX=g++
CXXFLAGS=--std=c++17 -W -Wall -O3 -DNDEBUG -I../native -march=native -pthread

SRCS=../native/Solver.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

all: c4solver generator pack_book pack_dense_book benchmark_book test_nps generate_nnue_data

c4solver: main.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o c4solver main.o $(OBJS) $(LDLIBS)

generator: generator.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o generator generator.o $(LDLIBS)

pack_book: pack_book.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o pack_book pack_book.o $(OBJS) $(LDLIBS)

pack_dense_book: pack_dense_book.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o pack_dense_book pack_dense_book.o $(OBJS) $(LDLIBS)

benchmark_book: benchmark_book.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o benchmark_book benchmark_book.o $(OBJS) $(LDLIBS)

test_nps: test_nps.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o test_nps test_nps.o $(OBJS) $(LDLIBS)

generate_nnue_data: generate_nnue_data.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o generate_nnue_data generate_nnue_data.o $(OBJS) $(LDLIBS)

.depend: $(SRCS)
	$(CXX) $(CXXFLAGS) -MM $^ > ./.depend
	
-include .depend

clean:
	rm -f *.o ../native/*.o .depend c4solver generator pack_book pack_dense_book benchmark_book test_nps generate_nnue_data
