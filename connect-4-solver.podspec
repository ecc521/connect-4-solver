require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "connect-4-solver"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0", :tvos => "12.0" }
  s.source       = { :git => "https://github.com/ecc521/connect4.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp}", "native/**/*.{h,hpp,cpp}"
  
  # Exclude the Emscripten/WASM bindings entirely from the iOS compiled framework
  s.exclude_files = "native/analyze.cpp"

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES" => "YES"
  }

  s.dependency "React-Core"
end
