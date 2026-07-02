import mongoose from 'mongoose';

const featuredStorySchema = new mongoose.Schema({
    category: { type: String, trim: true },
    date: { type: String, trim: true, maxlength: 20 },
    layoutType: { type: String, enum: ['top-down', 'left-right'], default: 'top-down' },
    heading: { type: String, trim: true, maxlength: 70 },
    shortDescription: { type: String, trim: true, maxlength: 250 },
    imageURL: { type: String, default: null }
});

const mixedArticleSchema = new mongoose.Schema({
    category: { type: String, trim: true },
    date: { type: String, trim: true, maxlength: 20 },
    layoutType: { type: String, enum: ['top-down', 'left-right'], default: 'top-down' },
    heading: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    imageURL: { type: String, default: null }
});

const newsCardSchema = new mongoose.Schema({
    category: { type: String, trim: true },
    heading: { type: String, trim: true, maxlength: 60 },
    imageURL: { type: String, default: null }
});

const sidebarArticleSchema = new mongoose.Schema({
    heading: { type: String, trim: true, maxlength: 60 },
    smallDescription: { type: String, trim: true, maxlength: 150 }
});

const opinionColumnSchema = new mongoose.Schema({
    author: { type: String, trim: true, maxlength: 40 },
    heading: { type: String, trim: true, maxlength: 60 },
    content: { type: String, trim: true, maxlength: 300 }
});

const galleryImageSchema = new mongoose.Schema({
    imageURL: { type: String, required: true }
});

const magazineSchema = new mongoose.Schema({
    // Magazine Information
    title: { type: String, trim: true },
    volumeNumber: { type: String, trim: true },
    issueNumber: { type: String, trim: true },
    publishDate: { type: String, trim: true },
    coverImageURL: { type: String, default: null },
    shortDescription: { type: String, trim: true },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Draft' },

    // Hero Story
    heroStory: {
        heading: { type: String, trim: true, maxlength: 80 },
        subHeading: { type: String, trim: true, maxlength: 150 },
        description: { type: String, trim: true, maxlength: 500 },
        imageURL: { type: String, default: null }
    },

    // Featured Stories
    featuredStories: [featuredStorySchema],

    // News Cards
    newsCards: [newsCardSchema],

    // Sidebar Articles
    sidebarArticles: [sidebarArticleSchema],

    // Advertisement / Banner Section
    advertisement: {
        bannerImageURL: { type: String, default: null },
        redirectLink: { type: String, trim: true },
        isEnabled: { type: Boolean, default: false }
    },

    // In-Depth Analysis
    inDepthAnalysis: {
        heading: { type: String, trim: true, maxlength: 100 },
        author: { type: String, trim: true, maxlength: 40 },
        description: { type: String, trim: true, maxlength: 800 },
        imageURL: { type: String, default: null }
    },

    // Opinion Columns
    opinionColumns: [opinionColumnSchema],

    // Mixed Articles (The Long Feed)
    mixedArticles: [mixedArticleSchema],

    // Categories
    categories: [{ type: String, trim: true }],

    // SEO Fields
    seo: {
        pageTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true },
        keywords: { type: String, trim: true }
    }
}, { timestamps: true });

export default mongoose.model('Magazine', magazineSchema);
