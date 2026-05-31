package expo.modules.connect4solver

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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

        AsyncFunction("analyze") { solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, weak: Boolean, bookPtrStr: String, align: Int, wrap: Boolean ->
            val result = nativeAnalyze(solverPtrStr, position, threads, width, height, bookPtrStr, align, wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }

        AsyncFunction("analyzeHeuristic") { solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Boolean ->
            val result = nativeAnalyzeHeuristic(solverPtrStr, position, maxDepth, threads, timeoutMs, width, height, bookPtrStr, align, wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }

        AsyncFunction("solve") { solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, weak: Boolean, bookPtrStr: String, align: Int, wrap: Boolean ->
            val result = nativeSolve(solverPtrStr, position, threads, width, height, bookPtrStr, align, wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }

        AsyncFunction("solveHeuristic") { solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, bookPtrStr: String, align: Int, wrap: Boolean ->
            val result = nativeSolveHeuristic(solverPtrStr, position, maxDepth, threads, timeoutMs, width, height, bookPtrStr, align, wrap)
            if (result != null) {
                return@AsyncFunction result.toList()
            } else {
                throw Exception("Unsupported board size")
            }
        }
    }
}
