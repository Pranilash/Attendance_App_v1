import mongoose, { Schema } from "mongoose";

const faceEmbeddingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUser",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    // Face embedding vector (128-dimensional array from face-api.js)
    embedding: [
      {
        type: Number,
        required: true,
      },
    ],
    // Reference image stored in Cloudinary
    referenceImage: {
      publicId: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    // Additional images for better matching (optional)
    additionalImages: [
      {
        publicId: String,
        url: String,
        embedding: [Number],
      },
    ],
    // Registration metadata
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    registrationDevice: {
      type: String,
    },
    registrationIpAddress: {
      type: String,
    },
    // Liveness verification during registration
    registrationLiveness: {
      blinkVerified: {
        type: Boolean,
        default: false,
      },
      headMovementVerified: {
        type: Boolean,
        default: false,
      },
      smileVerified: {
        type: Boolean,
        default: false,
      },
      livenessScore: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    // Model information (for future compatibility)
    modelInfo: {
      name: {
        type: String,
        default: "face-api.js",
      },
      version: {
        type: String,
        default: "0.22.2",
      },
      descriptorSize: {
        type: Number,
        default: 128,
      },
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updateCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
faceEmbeddingSchema.index({ userId: 1 }, { unique: true });
faceEmbeddingSchema.index({ isActive: 1 });

// Method to calculate cosine similarity between two embeddings
faceEmbeddingSchema.statics.cosineSimilarity = function (embeddingA, embeddingB) {
  if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Method to find best match for an embedding
faceEmbeddingSchema.statics.findBestMatch = async function (
  queryEmbedding,
  threshold = 0.6
) {
  const allEmbeddings = await this.find({ isActive: true }).populate(
    "userId",
    "name email enrollmentNumber role isActive"
  );

  let bestMatch = null;
  let bestScore = -1;

  for (const record of allEmbeddings) {
    // Skip if user is not active
    if (!record.userId || !record.userId.isActive) {
      continue;
    }

    const similarity = this.cosineSimilarity(queryEmbedding, record.embedding);

    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = {
        user: record.userId,
        similarity: similarity,
        embeddingId: record._id,
      };
    }

    // Also check additional images if available
    if (record.additionalImages && record.additionalImages.length > 0) {
      for (const additional of record.additionalImages) {
        if (additional.embedding) {
          const additionalSimilarity = this.cosineSimilarity(
            queryEmbedding,
            additional.embedding
          );
          if (additionalSimilarity > bestScore && additionalSimilarity >= threshold) {
            bestScore = additionalSimilarity;
            bestMatch = {
              user: record.userId,
              similarity: additionalSimilarity,
              embeddingId: record._id,
            };
          }
        }
      }
    }
  }

  return bestMatch;
};

// Method to verify face against stored embedding
faceEmbeddingSchema.methods.verifyFace = function (queryEmbedding, threshold = 0.6) {
  const similarity = this.constructor.cosineSimilarity(
    queryEmbedding,
    this.embedding
  );

  return {
    isMatch: similarity >= threshold,
    similarity: similarity,
    threshold: threshold,
  };
};

// Method to update embedding
faceEmbeddingSchema.methods.updateEmbedding = async function (
  newEmbedding,
  imageData = null
) {
  this.embedding = newEmbedding;
  this.lastUpdated = new Date();
  this.updateCount += 1;

  if (imageData) {
    // Update reference image if provided
    this.referenceImage = imageData;
  }

  return this.save();
};

// Method to add additional image with embedding
faceEmbeddingSchema.methods.addAdditionalImage = async function (
  embedding,
  imageData
) {
  if (!this.additionalImages) {
    this.additionalImages = [];
  }

  // Limit to 5 additional images
  if (this.additionalImages.length >= 5) {
    // Remove the oldest additional image
    this.additionalImages.shift();
  }

  this.additionalImages.push({
    ...imageData,
    embedding: embedding,
  });

  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get embedding statistics
faceEmbeddingSchema.statics.getStats = async function () {
  const total = await this.countDocuments({ isActive: true });
  const withLiveness = await this.countDocuments({
    isActive: true,
    "registrationLiveness.blinkVerified": true,
    "registrationLiveness.headMovementVerified": true,
  });

  return {
    total,
    withLiveness,
    withoutLiveness: total - withLiveness,
  };
};

// Pre-save validation
faceEmbeddingSchema.pre("save", function (next) {
  // Validate embedding size (should be 128 for face-api.js)
  if (this.embedding && this.embedding.length !== 128) {
    // Allow for flexibility but log warning
    console.warn(
      `Warning: Embedding size is ${this.embedding.length}, expected 128`
    );
  }
  next();
});

export const FaceEmbedding = mongoose.model("FaceEmbedding", faceEmbeddingSchema);