import * as FirebaseService from './services/firebase';
import fs from 'fs';

async function upload() {
    const filePath = process.argv[2] || './article_questions.json';
    const category = process.argv[3] || 'GENERAL';
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const questions = JSON.parse(data);
        console.log(`Read ${questions.length} questions from ${filePath}`);
        await FirebaseService.saveArticleQuestions(questions, category);
        console.log(`Successfully uploaded questions to Firestore in category: ${category}`);
    } catch (e) {
        console.error("Upload failed:", e);
    }
}

upload();
