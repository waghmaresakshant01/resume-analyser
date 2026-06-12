import mongoose from 'mongoose';

const resumeReportSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'txt', 'md', 'docx']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analysis: {
    extractedSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [String],
      default: []
    },
    improvementSuggestions: {
      type: [String],
      default: []
    },
    recommendedTech: {
      type: [String],
      default: []
    },
    recommendedCourses: [
      {
        name: { type: String, required: true },
        platform: { type: String, required: true }
      }
    ],
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    summary: {
      type: String,
      required: true
    }
  }
});

const ResumeReport = mongoose.model('ResumeReport', resumeReportSchema);

export default ResumeReport;
