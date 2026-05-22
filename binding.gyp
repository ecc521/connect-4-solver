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
      "variables": {
        "use_pgo%": "false"
      },
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions", "-fno-rtti" ],
      "cflags_cc": [ "-std=c++20", "-O3", "-march=native", "-DNDEBUG", "-pthread", "-frtti", "-DUSE_PTHREADS" ],
      "conditions": [
        ['OS=="mac"', {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "GCC_ENABLE_CPP_RTTI": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++20", "-O3", "-march=native", "-DNDEBUG", "-pthread", "-frtti", "-DUSE_PTHREADS"]
          }
        }],
        ['use_pgo=="true" and OS=="mac"', {
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS": [ "-fprofile-instr-use=<(module_root_dir)/default.profdata" ],
            "OTHER_LDFLAGS": [ "-fprofile-instr-use=<(module_root_dir)/default.profdata" ]
          }
        }],
        ['use_pgo=="true" and OS!="mac"', {
          "cflags_cc": [ "-fprofile-use" ],
          "ldflags": [ "-fprofile-use" ]
        }],
        ['OS=="linux"', {
          "libraries": [ "-latomic" ]
        }]
      ]
    }
  ]
}
