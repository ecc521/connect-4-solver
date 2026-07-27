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

public class Connect4SolverModule: Module {
    public func definition() -> ModuleDefinition {
        Name("Connect4Solver")

        Function("createCache") { (width: Int, height: Int, sizeBytes: Double, align: Int, wrap: Bool) -> String in
            return Connect4SolverWrapper.createCache(Int32(width), height: Int32(height), sizeBytes: sizeBytes, align: Int32(align), wrap: wrap)
        }

        Function("destroyCache") { (cachePtrStr: String) in
            Connect4SolverWrapper.destroyCache(cachePtrStr)
        }

        Function("createSolver") { (width: Int, height: Int, cachePtrStr: String, align: Int, wrap: Bool) -> String in
            return Connect4SolverWrapper.createSolver(Int32(width), height: Int32(height), cachePtrStr: cachePtrStr, align: Int32(align), wrap: wrap)
        }

        Function("destroySolver") { (solverPtrStr: String, width: Int, height: Int, align: Int, wrap: Bool) in
            Connect4SolverWrapper.destroySolver(solverPtrStr, width: Int32(width), height: Int32(height), align: Int32(align), wrap: wrap)
        }

        Function("stop") { (solverPtrStr: String, width: Int, height: Int, align: Int, wrap: Bool) in
            Connect4SolverWrapper.stop(solverPtrStr, width: Int32(width), height: Int32(height), align: Int32(align), wrap: wrap)
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

        AsyncFunction("solve") { (args: AnalyzeArgs, promise: Promise) in
            DispatchQueue.global(qos: .userInitiated).async {
                if let result = Connect4SolverWrapper.solve(args.solverPtr, position: args.pos, threads: Int32(args.threads), width: Int32(args.w), height: Int32(args.h), bookPtrStr: args.bookPtr, align: Int32(args.align), wrap: args.wrap) {
                    promise.resolve(result)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            }
        }

    }
}
