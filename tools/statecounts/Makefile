CXX := g++
CXXFLAGS := --std=c++17 -W -Wall -O3 -DNDEBUG -I../../native -march=native -pthread

SYLVAN_INC := -I sylvan/src -I sylvan/build/_deps/lace-src/src -I sylvan/build/_deps/lace-build
SYLVAN_LIBS := sylvan/build/src/libsylvan.a sylvan/build/_deps/lace-build/liblace.a

LDLIBS=
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	LDLIBS += -latomic
endif

SRCS=compute_sylvan_counts.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

all: compute_sylvan_counts

compute_sylvan_counts.o: compute_sylvan_counts.cpp
	$(CXX) $(CXXFLAGS) $(SYLVAN_INC) -c $< -o $@

compute_sylvan_counts: compute_sylvan_counts.o
	$(CXX) $(CXXFLAGS) -o $@ $^ $(SYLVAN_LIBS)

.depend: $(SRCS)
	$(CXX) $(CXXFLAGS) -MM $^ > ./.depend
	
-include .depend

clean:
	rm -f *.o .depend compute_sylvan_counts
