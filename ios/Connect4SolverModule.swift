import ExpoModulesCore

public class Connect4SolverModule: Module {
    public func definition() -> ModuleDefinition {
        Name("Connect4Solver")

        Function("createCache") { (width: Int, height: Int, sizeBytes: Double, isHeuristic: Bool, align: Int, wrap: Bool) -> String in
            return Connect4SolverWrapper.createCache(Int32(width), height: Int32(height), sizeBytes: sizeBytes, isHeuristic: isHeuristic, align: Int32(align), wrap: wrap)
        }

        Function("destroyCache") { (cachePtrStr: String) in
            Connect4SolverWrapper.destroyCache(cachePtrStr)
        }

        Function("createSolver") { (width: Int, height: Int, cachePtrStr: String, isHeuristic: Bool, align: Int, wrap: Bool) -> String in
            return Connect4SolverWrapper.createSolver(Int32(width), height: Int32(height), cachePtrStr: cachePtrStr, isHeuristic: isHeuristic, align: Int32(align), wrap: wrap)
        }

        Function("destroySolver") { (solverPtrStr: String, width: Int, height: Int, isHeuristic: Bool, align: Int, wrap: Bool) in
            Connect4SolverWrapper.destroySolver(solverPtrStr, width: Int32(width), height: Int32(height), isHeuristic: isHeuristic, align: Int32(align), wrap: wrap)
        }

        Function("stop") { (solverPtrStr: String, width: Int, height: Int, isHeuristic: Bool, align: Int, wrap: Bool) in
            Connect4SolverWrapper.stop(solverPtrStr, width: Int32(width), height: Int32(height), isHeuristic: isHeuristic, align: Int32(align), wrap: wrap)
        }

        Function("createBookFromBuffer") { (width: Int, height: Int, base64Str: String) -> String in
            return Connect4SolverWrapper.createBookFromBuffer(Int32(width), height: Int32(height), base64Str: base64Str)
        }

        Function("destroyBook") { (width: Int, height: Int, bookPtrStr: String) in
            Connect4SolverWrapper.destroyBook(Int32(width), height: Int32(height), bookPtrStr: bookPtrStr)
        }

        AsyncFunction("analyze") { (solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, weak: Bool, bookPtrStr: String, align: Int, wrap: Bool, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.analyze(solverPtrStr, position: position, threads: Int32(threads), width: Int32(width), height: Int32(height), bookPtrStr: bookPtrStr, align: Int32(align), wrap: wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

        AsyncFunction("analyzeHeuristic") { (solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Bool, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.analyzeHeuristic(solverPtrStr, position: position, maxDepth: Int32(maxDepth), threads: Int32(threads), timeoutMs: timeoutMs, width: Int32(width), height: Int32(height), bookPtrStr: bookPtrStr, align: Int32(align), wrap: wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

        AsyncFunction("solve") { (solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, weak: Bool, bookPtrStr: String, align: Int, wrap: Bool, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.solve(solverPtrStr, position: position, threads: Int32(threads), width: Int32(width), height: Int32(height), bookPtrStr: bookPtrStr, align: Int32(align), wrap: wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

        AsyncFunction("solveHeuristic") { (solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Bool, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.solveHeuristic(solverPtrStr, position: position, maxDepth: Int32(maxDepth), threads: Int32(threads), timeoutMs: timeoutMs, width: Int32(width), height: Int32(height), bookPtrStr: bookPtrStr, align: Int32(align), wrap: wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }
    }
}
