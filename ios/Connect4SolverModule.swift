import ExpoModulesCore

struct AnalyzeArgs: Record {
    @Field var solverPtr: String
    @Field var pos: String
    @Field var threads: Int
    @Field var w: Int
    @Field var h: Int
    @Field var bookPtr: String
    @Field var align: Int
    @Field var wrap: Bool
}

struct AnalyzeHeuristicArgs: Record {
    @Field var solverPtr: String
    @Field var pos: String
    @Field var maxDepth: Int
    @Field var threads: Int
    @Field var timeoutMs: Double
    @Field var w: Int
    @Field var h: Int
    @Field var bookPtr: String
    @Field var align: Int
    @Field var wrap: Bool
}

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
            return Connect4SolverWrapper.createBook(fromBuffer: Int32(width), height: Int32(height), base64Str: base64Str)
        }

        Function("destroyBook") { (width: Int, height: Int, bookPtrStr: String) in
            Connect4SolverWrapper.destroyBook(Int32(width), height: Int32(height), bookPtrStr: bookPtrStr)
        }

        AsyncFunction("analyze") { (args: AnalyzeArgs, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.analyze(args.solverPtr, position: args.pos, threads: Int32(args.threads), width: Int32(args.w), height: Int32(args.h), bookPtrStr: args.bookPtr, align: Int32(args.align), wrap: args.wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

        AsyncFunction("analyzeHeuristic") { (args: AnalyzeHeuristicArgs, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.analyzeHeuristic(args.solverPtr, position: args.pos, maxDepth: Int32(args.maxDepth), threads: Int32(args.threads), timeoutMs: args.timeoutMs, width: Int32(args.w), height: Int32(args.h), bookPtrStr: args.bookPtr, align: Int32(args.align), wrap: args.wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

        AsyncFunction("solve") { (args: AnalyzeArgs, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.solve(args.solverPtr, position: args.pos, threads: Int32(args.threads), width: Int32(args.w), height: Int32(args.h), bookPtrStr: args.bookPtr, align: Int32(args.align), wrap: args.wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

        AsyncFunction("solveHeuristic") { (args: AnalyzeHeuristicArgs, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.solveHeuristic(args.solverPtr, position: args.pos, maxDepth: Int32(args.maxDepth), threads: Int32(args.threads), timeoutMs: args.timeoutMs, width: Int32(args.w), height: Int32(args.h), bookPtrStr: args.bookPtr, align: Int32(args.align), wrap: args.wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }
    }
}
