cmake_minimum_required(VERSION 3.10.2)
project(connect4solver)

set(CMAKE_CXX_STANDARD 20)

add_library(connect4solver SHARED
    cpp/react-native-connect-4-solver.cpp
)

find_library(log-lib log)

target_link_libraries(connect4solver ${log-lib})
