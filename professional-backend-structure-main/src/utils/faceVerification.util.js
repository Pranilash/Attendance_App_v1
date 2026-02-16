/**
 * Face Verification Utility
 * 
 * This utility handles face embedding comparison using cosine similarity
 * and provides helper functions for face verification workflows.
 */

// Default similarity threshold (can be overridden via environment variable)
const DEFAULT_SIMILARITY_THRESHOLD = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.6;
const LIVENESS_CONFIDENCE_THRESHOLD = parseFloat(process.env.LIVENESS_CONFIDENCE_THRESHOLD) || 0.8;

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} Similarity score between 0 and 1
 */
export const cosineSimilarity = (vectorA, vectorB) => {
  if (!vectorA || !vectorB) {
    return 0;
  }

  if (vectorA.length !== vectorB.length) {
    console.warn("Vector length mismatch: " + vectorA.length + " vs " + vectorB.length);
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Calculate Euclidean distance between two vectors
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} Distance (lower is more similar)
 */
export const euclideanDistance = (vectorA, vectorB) => {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) {
    sum += Math.pow(vectorA[i] - vectorB[i], 2);
  }

  return Math.sqrt(sum);
};

/**
 * Convert Euclidean distance to similarity score
 * @param {number} distance - Euclidean distance
 * @param {number} maxDistance - Maximum expected distance (default: 1.0)
 * @returns {number} Similarity score between 0 and 1
 */
export const distanceToSimilarity = (distance, maxDistance = 1.0) => {
  return Math.max(0, 1 - distance / maxDistance);
};

/**
 * Verify face embedding against stored embedding
 * @param {number[]} queryEmbedding - Face embedding to verify
 * @param {number[]} storedEmbedding - Stored face embedding
 * @param {number} threshold - Similarity threshold (default: 0.6)
 * @returns {Object} Verification result
 */
export const verifyFaceEmbedding = (queryEmbedding, storedEmbedding, threshold = DEFAULT_SIMILARITY_THRESHOLD) => {
  const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
  const distance = euclideanDistance(queryEmbedding, storedEmbedding);

  return {
    isMatch: similarity >= threshold,
    similarity: Math.round(similarity * 1000) / 1000, // Round to 3 decimal places
    distance: Math.round(distance * 1000) / 1000,
    threshold,
    confidence: getConfidenceLevel(similarity),
  };
};

/**
 * Get confidence level based on similarity score
 * @param {number} similarity - Similarity score
 * @returns {string} Confidence level (low, medium, high)
 */
const getConfidenceLevel = (similarity) => {
  if (similarity >= 0.9) return "high";
  if (similarity >= 0.75) return "medium";
  return "low";
};

/**
 * Find best match for a query embedding among multiple stored embeddings
 * @param {number[]} queryEmbedding - Face embedding to match
 * @param {Array<{userId: string, embedding: number[]}>} storedEmbeddings - Array of stored embeddings
 * @param {number} threshold - Similarity threshold
 * @returns {Object|null} Best match or null if no match found
 */
export const findBestMatch = (queryEmbedding, storedEmbeddings, threshold = DEFAULT_SIMILARITY_THRESHOLD) => {
  if (!queryEmbedding || !storedEmbeddings || storedEmbeddings.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = -1;

  for (const record of storedEmbeddings) {
    if (!record.embedding) continue;

    const similarity = cosineSimilarity(queryEmbedding, record.embedding);

    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = {
        userId: record.userId,
        similarity: Math.round(similarity * 1000) / 1000,
        embeddingId: record._id || record.id,
      };
    }

    // Check additional embeddings if available
    if (record.additionalImages && record.additionalImages.length > 0) {
      for (const additional of record.additionalImages) {
        if (additional.embedding) {
          const additionalSimilarity = cosineSimilarity(queryEmbedding, additional.embedding);
          if (additionalSimilarity > bestScore && additionalSimilarity >= threshold) {
            bestScore = additionalSimilarity;
            bestMatch = {
              userId: record.userId,
              similarity: Math.round(additionalSimilarity * 1000) / 1000,
              embeddingId: record._id || record.id,
            };
          }
        }
      }
    }
  }

  return bestMatch;
};

/**
 * Validate face embedding format
 * @param {number[]} embedding - Face embedding to validate
 * @returns {Object} Validation result
 */
export const validateEmbedding = (embedding) => {
  if (!embedding) {
    return { valid: false, error: "Embedding is required" };
  }

  if (!Array.isArray(embedding)) {
    return { valid: false, error: "Embedding must be an array" };
  }

  if (embedding.length !== 128) {
    return { 
      valid: false, 
      error: "Embedding must be 128-dimensional, got " + embedding.length + " dimensions" 
    };
  }

  for (let i = 0; i < embedding.length; i++) {
    if (typeof embedding[i] !== "number" || isNaN(embedding[i])) {
      return { valid: false, error: "Embedding must contain only numbers" };
    }
  }

  return { valid: true };
};

/**
 * Validate liveness check results
 * @param {Object} livenessChecks - Liveness check results
 * @param {number} livenessScore - Overall liveness score
 * @returns {Object} Validation result
 */
export const validateLiveness = (livenessChecks, livenessScore = null) => {
  const result = {
    valid: true,
    checks: {
      blink: false,
      headMovement: false,
      smile: false,
    },
    score: livenessScore,
    passedCount: 0,
    requiredChecks: 2, // Minimum required checks to pass
  };

  if (livenessChecks) {
    result.checks.blink = livenessChecks.blink === true;
    result.checks.headMovement = livenessChecks.headMovement === true;
    result.checks.smile = livenessChecks.smile === true;
  }

  result.passedCount = [
    result.checks.blink,
    result.checks.headMovement,
    result.checks.smile,
  ].filter(Boolean).length;

  // Check if minimum required checks passed
  if (result.passedCount < result.requiredChecks) {
    result.valid = false;
    result.reason = "Insufficient liveness checks passed. Required: " + result.requiredChecks + ", Passed: " + result.passedCount;
  }

  // Check overall liveness score if provided
  if (livenessScore !== null && livenessScore < LIVENESS_CONFIDENCE_THRESHOLD) {
    result.valid = false;
    result.reason = "Liveness confidence too low. Required: " + LIVENESS_CONFIDENCE_THRESHOLD + ", Got: " + livenessScore;
  }

  return result;
};

/**
 * Calculate average embedding from multiple samples
 * @param {number[][]} embeddings - Array of face embeddings
 * @returns {number[]} Average embedding
 */
export const calculateAverageEmbedding = (embeddings) => {
  if (!embeddings || embeddings.length === 0) {
    return null;
  }

  const validEmbeddings = embeddings.filter(e => validateEmbedding(e).valid);
  
  if (validEmbeddings.length === 0) {
    return null;
  }

  const avgEmbedding = new Array(128).fill(0);

  for (const embedding of validEmbeddings) {
    for (let i = 0; i < 128; i++) {
      avgEmbedding[i] += embedding[i];
    }
  }

  for (let i = 0; i < 128; i++) {
    avgEmbedding[i] /= validEmbeddings.length;
  }

  return avgEmbedding;
};

/**
 * Generate face verification result for API response
 * @param {Object} options - Verification options
 * @returns {Object} Formatted verification result
 */
export const generateVerificationResult = (options) => {
  const {
    isMatch,
    similarity,
    threshold,
    livenessResult,
    userId,
    sessionId,
  } = options;

  return {
    success: isMatch,
    message: isMatch 
      ? "Face verification successful" 
      : "Face verification failed. " + (livenessResult && !livenessResult.valid 
        ? livenessResult.reason 
        : "Face does not match registered profile."),
    data: {
      verified: isMatch,
      similarity: similarity,
      threshold: threshold,
      liveness: livenessResult ? {
        passed: livenessResult.valid,
        checks: livenessResult.checks,
        score: livenessResult.score,
      } : null,
      userId: isMatch ? userId : null,
      sessionId: sessionId,
      verifiedAt: new Date().toISOString(),
    },
  };
};

export default {
  cosineSimilarity,
  euclideanDistance,
  distanceToSimilarity,
  verifyFaceEmbedding,
  findBestMatch,
  validateEmbedding,
  validateLiveness,
  calculateAverageEmbedding,
  generateVerificationResult,
};