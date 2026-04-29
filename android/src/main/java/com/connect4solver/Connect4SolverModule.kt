package com.connect4solver

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import java.util.concurrent.Executors

class Connect4SolverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // Utilizing an unbounded cached thread pool allows developers to manage their own concurrency
    private val executor = Executors.newCachedThreadPool()

    override fun getName(): String {
        return "Connect4Solver"
    }

    external fun nativeCreateCache(width: Int, height: Int, sizeBytes: Double, isHeuristic: Boolean): String
    external fun nativeDestroyCache(cachePtrStr: String)
    external fun nativeCreateSolver(width: Int, height: Int, cachePtrStr: String, isHeuristic: Boolean): String
    external fun nativeDestroySolver(solverPtrStr: String, width: Int, height: Int, isHeuristic: Boolean)
    external fun nativeAnalyze(solverPtrStr: String, position: String, threads: Int, width: Int, height: Int): IntArray?
    external fun nativeAnalyzeHeuristic(solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int): IntArray?

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun createCache(width: Int, height: Int, sizeBytes: Double, isHeuristic: Boolean): String {
        return nativeCreateCache(width, height, sizeBytes, isHeuristic)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun destroyCache(cachePtrStr: String) {
        nativeDestroyCache(cachePtrStr)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun createSolver(width: Int, height: Int, cachePtrStr: String, isHeuristic: Boolean): String {
        return nativeCreateSolver(width, height, cachePtrStr, isHeuristic)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun destroySolver(solverPtrStr: String, width: Int, height: Int, isHeuristic: Boolean) {
        nativeDestroySolver(solverPtrStr, width, height, isHeuristic)
    }

    @ReactMethod
    fun analyze(solverPtrStr: String, position: String, threads: Int, width: Int, height: Int, weak: Boolean, promise: Promise) {
        executor.execute {
            try {
                val result = nativeAnalyze(solverPtrStr, position, threads, width, height)
                if (result != null) {
                    val writableArray = Arguments.createArray()
                    for (i in result) {
                        writableArray.pushInt(i)
                    }
                    promise.resolve(writableArray)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun analyzeHeuristic(solverPtrStr: String, position: String, maxDepth: Int, threads: Int, timeoutMs: Double, width: Int, height: Int, promise: Promise) {
        executor.execute {
            try {
                val result = nativeAnalyzeHeuristic(solverPtrStr, position, maxDepth, threads, timeoutMs, width, height)
                if (result != null) {
                    val writableArray = Arguments.createArray()
                    for (i in result) {
                        writableArray.pushInt(i)
                    }
                    promise.resolve(writableArray)
                } else {
                    promise.reject("UNSUPPORTED_SIZE", "Unsupported board size")
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    companion object {
        init {
            System.loadLibrary("connect4solver")
        }
    }
}
