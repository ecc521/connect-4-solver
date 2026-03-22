package com.connect4solver

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import java.util.concurrent.Executors

class Connect4SolverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // Utilizing a cached fixed thread pool ensures we execute safely off the React Native UI thread
    private val executor = Executors.newFixedThreadPool(4)

    override fun getName(): String {
        return "Connect4Solver"
    }

    external fun nativeAnalyze(position: String, threads: Int, width: Int, height: Int): IntArray?

    @ReactMethod
    fun analyze(position: String, threads: Int, width: Int, height: Int, weak: Boolean, promise: Promise) {
        executor.execute {
            try {
                val result = nativeAnalyze(position, threads, width, height)
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
