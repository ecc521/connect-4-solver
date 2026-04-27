CXX=g++
CXXFLAGS=--std=c++14 -W -Wall -O3 -DNDEBUG -I../native -march=native -pthread

SRCS=../native/Solver.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

all: c4solver generator pack_dense_book pack_book find_depth_limit

c4solver: main.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o c4solver main.o $(OBJS) $(LDLIBS)

generator: generator.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o generator generator.o $(LDLIBS)

pack_dense_book: pack_dense_book.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o pack_dense_book pack_dense_book.o $(OBJS) $(LDLIBS)

pack_book: pack_book.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o pack_book pack_book.o $(OBJS) $(LDLIBS)

find_depth_limit: find_depth_limit.o $(OBJS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o find_depth_limit find_depth_limit.o $(OBJS) $(LDLIBS)

.depend: $(SRCS)
	$(CXX) $(CXXFLAGS) -MM $^ > ./.depend
	
-include .depend

clean:
	rm -f *.o ../native/*.o .depend c4solver generator pack_dense_book pack_book find_depth_limit
