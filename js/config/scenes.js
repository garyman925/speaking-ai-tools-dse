/**
 * Scene Configuration
 */
const scenes = {
    // Cafe scene
    cafe: {
        id: 'cafe',
        name: 'Cafe',
        background: 'assets/images/scene/cafe.png',
        thumbnail: 'assets/images/scene/cafe_thumb.png',
        aiCharacter: {
            name: 'Barista',
            avatar: {
                idle: 'assets/images/avatars/bot.png',
                speaking: 'assets/images/avatars/bot_speaking.webp'
            }
        },
        userCharacters: {
            female: {
                name: 'Customer',
                avatar: {
                    idle: 'assets/images/avatars/candidate.png',
                    speaking: 'assets/images/avatars/candidate_speaking.webp'
                }
            },
            male: {
                name: 'Customer',
                avatar: {
                    idle: 'assets/images/avatars/male_candidate.png',
                    speaking: 'assets/images/avatars/male_candidate_speaking.webp'
                }
            }
        },
        userCharacter: null,
        description: 'In the cafe scene, you are a customer interacting with a cafe staff member. You can try ordering food, asking about the menu, or discussing coffee varieties.',
        sampleDialogs: [
            'Hello, what would you like to drink today?',
            'What are your signature drinks here?',
            'I would like a latte, please.'
        ],
        welcomeMessage: 'Welcome to our cafe! What would you like to order today?',
        initialMessages: [
            {
                type: 'ai',
                audioPath: 'assets/audio/ai/cafe_welcome.mp3',
                isInitial: true
            }
        ]
    },
    
    // Office scene
    office: {
        name: 'Office',
        background: 'assets/images/scene/office.png',
        thumbnail: 'assets/images/scene/office_thumb.png',
        aiCharacter: {
            name: 'Colleague',
            avatar: {
                idle: 'assets/images/avatars/colleague.png',
                speaking: 'assets/images/avatars/colleague_speaking.webp'
            }
        },
        userCharacters: {
            female: {
                name: 'Interviewee',
                avatar: {
                    idle: 'assets/images/avatars/candidate.png',
                    speaking: 'assets/images/avatars/candidate_speaking.webp'
                }
            },
            male: {
                name: 'Interviewee',
                avatar: {
                    idle: 'assets/images/avatars/male_candidate.png',
                    speaking: 'assets/images/avatars/male_candidate_speaking.webp'
                }
            }
        },
        userCharacter: null,
        description: 'In the office scene, you are an employee discussing work-related matters with a colleague. You can discuss project progress, schedule meetings, or solve work problems.',
        sampleDialogs: [
            'Regarding this project, we need to discuss the schedule.',
            'Could you help me review this report?',
            'Are you available for the meeting next week?'
        ],
        welcomeMessage: 'Welcome to the office! How can I help you today?',
        initialMessages: [
            {
                type: 'ai',
                audioPath: 'assets/audio/ai/office_welcome.mp3',
                isInitial: true
            }
        ]
    },
    
    // Hospital scene
    hospital: {
        name: 'Hospital',
        background: 'assets/images/scene/hospital.png',
        thumbnail: 'assets/images/scene/hospital_thumb.png',
        aiCharacter: {
            name: 'Doctor',
            avatar: {
                idle: 'assets/images/avatars/doctor.png',
                speaking: 'assets/images/avatars/doctor_speaking.webp'
            }
        },
        userCharacters: {
            female: {
                name: 'Patient',
                avatar: {
                    idle: 'assets/images/avatars/candidate.png',
                    speaking: 'assets/images/avatars/candidate_speaking.webp'
                }
            },
            male: {
                name: 'Patient',
                avatar: {
                    idle: 'assets/images/avatars/male_candidate.png',
                    speaking: 'assets/images/avatars/male_candidate_speaking.webp'
                }
            }
        },
        userCharacter: null,
        description: 'In the hospital scene, you are a patient consulting with a doctor. You can describe symptoms, ask about treatment options, or discuss health concerns.',
        sampleDialogs: [
            'Please tell me about your recent symptoms.',
            'I have been experiencing headaches and fatigue lately.',
            'How should I take this medication?'
        ],
        welcomeMessage: 'Hello, welcome to the hospital. How can I help you today?',
        initialMessages: [
            {
                type: 'ai',
                audioPath: 'assets/audio/ai/hospital_welcome.mp3',
                isInitial: true
            }
        ]
    }
};

export default scenes; 