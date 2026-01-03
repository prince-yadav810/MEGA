// File Path: server/src/utils/apiHealthCheck.js

/**
 * API Health Check Utility
 * Validates API connections on server startup
 * Provides early warning if APIs are misconfigured
 */

const geminiService = require('../services/geminiService');
const googleVisionService = require('../services/googleVisionService');

/**
 * Check health of all AI APIs used by the system
 * @returns {Promise<Object>} Health status of all APIs
 */
async function checkAllAPIs() {
    console.log('\n📋 Checking API Health...\n');

    const healthStatus = {
        timestamp: new Date().toISOString(),
        overall: 'healthy',
        apis: {}
    };

    // Check Gemini API
    try {
        const geminiResult = await geminiService.testConnection();
        healthStatus.apis.gemini = {
            status: geminiResult.connected ? 'healthy' : 'unhealthy',
            availableModels: geminiResult.availableModels || [],
            testedModels: geminiResult.testedModels || {},
            error: geminiResult.error
        };

        if (!geminiResult.connected) {
            healthStatus.overall = 'degraded';
        }
    } catch (error) {
        healthStatus.apis.gemini = {
            status: 'error',
            error: error.message
        };
        healthStatus.overall = 'degraded';
    }

    // Check Vision API (simple key check, full test requires image)
    try {
        const visionResult = await googleVisionService.testConnection();
        healthStatus.apis.vision = {
            status: visionResult ? 'configured' : 'not_configured',
            error: visionResult ? null : 'GOOGLE_VISION_API_KEY not set'
        };

        if (!visionResult) {
            healthStatus.overall = 'degraded';
        }
    } catch (error) {
        healthStatus.apis.vision = {
            status: 'error',
            error: error.message
        };
        healthStatus.overall = 'degraded';
    }

    // Summary logging
    console.log('\n' + '='.repeat(50));
    console.log('📊 API HEALTH CHECK SUMMARY');
    console.log('='.repeat(50));

    // Gemini status
    const geminiStatus = healthStatus.apis.gemini?.status;
    if (geminiStatus === 'healthy') {
        console.log(`✅ Gemini API: Healthy`);
        console.log(`   Models: ${healthStatus.apis.gemini.availableModels.join(', ')}`);
    } else {
        console.log(`❌ Gemini API: ${geminiStatus || 'Unknown'}`);
        if (healthStatus.apis.gemini?.error) {
            console.log(`   Error: ${healthStatus.apis.gemini.error}`);
        }
    }

    // Vision status
    const visionStatus = healthStatus.apis.vision?.status;
    if (visionStatus === 'configured') {
        console.log(`✅ Vision API: Configured`);
    } else {
        console.log(`❌ Vision API: ${visionStatus || 'Unknown'}`);
        if (healthStatus.apis.vision?.error) {
            console.log(`   Error: ${healthStatus.apis.vision.error}`);
        }
    }

    console.log('='.repeat(50));

    // Overall status
    if (healthStatus.overall === 'healthy') {
        console.log('🎉 All APIs are healthy. Business card OCR is ready!\n');
    } else {
        console.log('⚠️  Some APIs have issues. Business card OCR may be limited.\n');
    }

    return healthStatus;
}

/**
 * Quick check if OCR feature is available
 * @returns {Promise<boolean>} True if OCR is operational
 */
async function isOCRAvailable() {
    try {
        // Check if both APIs are configured
        const hasGeminiKey = !!process.env.GEMINI_API_KEY;
        const hasVisionKey = !!process.env.GOOGLE_VISION_API_KEY;

        if (!hasGeminiKey || !hasVisionKey) {
            return false;
        }

        // Quick Gemini test
        const geminiResult = await geminiService.testConnection();
        return geminiResult.connected;
    } catch (error) {
        console.error('OCR availability check failed:', error.message);
        return false;
    }
}

/**
 * Get human-readable status for admin dashboard
 * @returns {Promise<Object>} Status object for UI display
 */
async function getStatusForDashboard() {
    const health = await checkAllAPIs();

    return {
        ocrEnabled: health.overall !== 'degraded',
        geminiStatus: health.apis.gemini?.status || 'unknown',
        geminiModels: health.apis.gemini?.availableModels || [],
        visionStatus: health.apis.vision?.status || 'unknown',
        lastChecked: health.timestamp,
        message: health.overall === 'healthy'
            ? 'Business card OCR is fully operational'
            : 'Some features may be limited. Check API configuration.'
    };
}

module.exports = {
    checkAllAPIs,
    isOCRAvailable,
    getStatusForDashboard
};
