#!/bin/bash
set -e

# PGO pipeline for WebAssembly.
# Generates profile data using the native benchmark (faster & avoids WASM indirect call crashes),
# then feeds it into emcc via -fprofile-use.
#
# NOTE: This requires both clang++ and emcc to use compatible LLVM versions.
# If they diverge, the profile data may be silently ignored by emcc.

echo "═══════════════════════════════════════════════"
echo " WASM PGO Pipeline"
echo "═══════════════════════════════════════════════"

# Check LLVM version compatibility
if command -v clang++ &> /dev/null && command -v emcc &> /dev/null; then
    CLANG_VER=$(clang++ --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "unknown")
    EMCC_VER=$(emcc --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "unknown")
    echo "  clang++ LLVM version: ${CLANG_VER}"
    echo "  emcc LLVM version:    ${EMCC_VER}"
    if [ "$CLANG_VER" != "$EMCC_VER" ] && [ "$CLANG_VER" != "unknown" ] && [ "$EMCC_VER" != "unknown" ]; then
        echo ""
        echo "  ⚠  WARNING: LLVM versions differ (clang++ ${CLANG_VER} vs emcc ${EMCC_VER})"
        echo "  ⚠  Profile data may be partially or fully ignored by emcc."
        echo ""
    fi
fi

echo ""
echo "Phase 1/2: Generating PGO profile data using native bindings..."
bash build_native_pgo.sh

echo ""
echo "Phase 2/2: Building WASM with PGO profile data..."
export PGO_FLAGS="-fprofile-use=default.profdata"
bash build.sh

echo ""
echo "═══════════════════════════════════════════════"
echo " WASM PGO pipeline complete!"
echo "═══════════════════════════════════════════════"
