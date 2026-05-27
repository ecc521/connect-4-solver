{
  "targets": [
    {
      "target_name": "connect4",
      "sources": [
        "native/node_binding.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "native"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions", "-fno-rtti" ],
      "cflags_cc": [
        "-ftemplate-depth=1024", "-std=c++20", "-O3", "-march=native", "-DNDEBUG", "-pthread", "-frtti", "-DUSE_PTHREADS" ],
      "conditions": [
        ['OS=="mac"', {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "GCC_ENABLE_CPP_RTTI": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++20", "-ftemplate-depth=1024", "-O3", "-march=native", "-DNDEBUG", "-pthread", "-frtti", "-DUSE_PTHREADS"]
          }
        }],
        ['OS=="linux"', {
          "libraries": [ "-latomic" ]
        }]
      ]
    }
  ]
}
