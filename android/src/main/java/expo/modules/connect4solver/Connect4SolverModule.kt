package expo.modules.connect4solver

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Field

class Connect4SolverModule : Module() {
    private external fun nativeCreateCache(width: Int, height: Int, sizeBytes: Double, isHeuristic: Boolean, align: Int, wrap: Boolean): String
    private external fun nativeDestroyCache(cachePtrStr: String)
    private external fun nativeCreateSolver(width: Int, height: Int, cachePtrStr: String, isHeuristic: Boolean, align: Int, wrap: Boolean): String
    private external fun nativeDestroySolver(solverPtrStr: String, width: Int, height: Int, isHeuristic: Boolean, align: Int, wrap: Boolean)
    private external fun nativeStop(solverPtrStr: String, width: Int, height: Int, isHeuristic: Boolean, align: Int, wrap: Boolean)
    private external fun nativeCreateBookFromBuffer(width: Int, height: Int, base64: ByteArray): String
    private external fun nativeDestroyBook(width: Int, height: Int, bookPtrStr: String)
    private external fun nativeAnalyze(solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Boolean): IntArray?
    private external fun nativeAnalyzeHeuristic(solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Boolean): IntArray?
    private external fun nativeSolve(solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Boolean): IntArray?
    private external fun nativeSolveHeuristic(solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Boolean): IntArray?

    class AnalyzeArgs : Record {
        @Field var solverPtr: String = ""
        @Field var pos: String = ""
        @Field var threads: Int = 1
        @Field var w: Int = 7
        @Field var h: Int = 6
        @Field var bookPtr: String = ""
        @Field var align: Int = 4
        @Field var wrap: Boolean = false
    }

    class AnalyzeHeuristicArgs : Record {
        @Field var solverPtr: String = ""
        @Field var pos: String = ""
        @Field var maxDepth: Int = 0
        @Field var threads: Int = 1
        @Field var timeoutMs: Double = 0.0
        @Field var w: Int = 7
        @Field var h: Int = 6
        @Field var bookPtr: String = ""
        @Field var align: Int = 4
        @Field var wrap: Boolean = false
    }

    companion object {
        init {
            System.loadLibrary("connect4solver")
        }
    }

    override fun definition() = ModuleDefinition {
        Name("Connect4Solver")

        Function("createCache") { width: Int, height: Int, sizeBytes: Double, isHeuristic: Boolean, align: Int, wrap: Boolean ->
            return@Function nativeCreateCache(width, height, sizeBytes, isHeuristic, align, wrap)
        }

        Function("destroyCache") { cachePtrStr: String ->
            nativeDestroyCache(cachePtrStr)
        }

        Function("createSolver") { width: Int, height: Int, cachePtrStr: String, isHeuristic: Boolean, align: Int, wrap: Boolean ->
            return@Function nativeCreateSolver(width, height, cachePtrStr, isHeuristic, align, wrap)
        }

        Function("destroySolver") { solverPtrStr: String, width: Int, height: Int, isHeuristic: Boolean, align: Int, wrap: Boolean ->
            nativeDestroySolver(solverPtrStr, width, height, isHeuristic, align, wrap)
        }

        Function("stop") { solverPtrStr: String, width: Int, height: Int, isHeuristic: Boolean, align: Int, wrap: Boolean ->
            nativeStop(solverPtrStr, width, height, isHeuristic, align, wrap)
        }

        Function("createBookFromBuffer") { width: Int, height: Int, base64Str: String ->
            val decodedBytes = android.util.Base64.decode(base64Str, android.util.Base64.DEFAULT)
            return@Function nativeCreateBookFromBuffer(width, height, decodedBytes)
        }

        Function("destroyBook") { width: Int, height: Int, bookPtrStr: String ->
            nativeDestroyBook(width, height, bookPtrStr)
        }

        AsyncFunction("analyze") { args: AnalyzeArgs ->
            val result = nativeAnalyze(args.solverPtr, args.pos, args.threads, args.w, args.h, args.bookPtr, args.align, args.wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }

        AsyncFunction("analyzeHeuristic") { args: AnalyzeHeuristicArgs ->
            val result = nativeAnalyzeHeuristic(args.solverPtr, args.pos, args.maxDepth, args.threads, args.timeoutMs, args.w, args.h, args.bookPtr, args.align, args.wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }

        AsyncFunction("solve") { args: AnalyzeArgs ->
            val result = nativeSolve(args.solverPtr, args.pos, args.threads, args.w, args.h, args.bookPtr, args.align, args.wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }

        AsyncFunction("solveHeuristic") { args: AnalyzeHeuristicArgs ->
            val result = nativeSolveHeuristic(args.solverPtr, args.pos, args.maxDepth, args.threads, args.timeoutMs, args.w, args.h, args.bookPtr, args.align, args.wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }
    }
}
