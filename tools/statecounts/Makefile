CXX := g++
CXXFLAGS := --std=c++17 -W -Wall -O3 -DNDEBUG -I../../native -march=native -pthread

SYLVAN_INC := -I sylvan/src -I sylvan/build/_deps/lace-src/src -I sylvan/build/_deps/lace-build
SYLVAN_LIBS := sylvan/build/src/libsylvan.a sylvan/build/_deps/lace-build/liblace.a

# CUDD parameters
CUDD_INC := -Icudd/cplusplus -Icudd/cudd -Icudd
CUDD_LIBS := cudd/cudd/.libs/libcudd.a

LDLIBS=
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	LDLIBS += -latomic
endif

SRCS=compute_board_counts.cpp compute_bdd_counts.cpp compute_sylvan_counts.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

all: compute_board_counts compute_bdd_counts compute_sylvan_counts

compute_board_counts.o: compute_board_counts.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

compute_board_counts: compute_board_counts.o
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $^ $(LDLIBS)

compute_bdd_counts.o: compute_bdd_counts.cpp
	$(CXX) $(CXXFLAGS) $(CUDD_INC) -c $< -o $@

compute_bdd_counts: compute_bdd_counts.o
	$(CXX) $(CXXFLAGS) -o $@ $^ $(CUDD_LIBS)

compute_sylvan_counts.o: compute_sylvan_counts.cpp
	$(CXX) $(CXXFLAGS) $(SYLVAN_INC) -c $< -o $@

compute_sylvan_counts: compute_sylvan_counts.o
	$(CXX) $(CXXFLAGS) -o $@ $^ $(SYLVAN_LIBS)

.depend: $(SRCS)
	$(CXX) $(CXXFLAGS) -MM $^ > ./.depend
	
-include .depend

clean:
	rm -f *.o .depend compute_board_counts compute_bdd_counts compute_sylvan_counts
