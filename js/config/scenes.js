/**
 * 场景配置
 */
const scenes = {
    // 咖啡厅场景
    cafe: {
        name: '咖啡厅',
        background: 'assets/images/scene/cafe.png',
        thumbnail: 'assets/images/scene/cafe_thumb.png',
        aiCharacter: {
            name: '咖啡店员',
            avatar: {
                idle: 'assets/images/avatars/cafe_staff.png',
                speaking: 'assets/images/avatars/cafe_staff_speaking.webp'
            }
        },
        userCharacter: {
            name: '顾客',
            avatar: {
                idle: 'assets/images/avatars/customer.png',
                speaking: 'assets/images/avatars/customer_speaking.webp'
            }
        },
        description: '在咖啡厅场景中，你是一位顾客，正在与咖啡店员进行交流。你可以尝试点餐、询问菜单或讨论咖啡种类。',
        sampleDialogs: [
            '您好，请问今天想喝点什么？',
            '这里的招牌饮品是什么？',
            '请给我一杯拿铁，谢谢。'
        ],
        welcomeMessage: '欢迎光临我们的咖啡厅！今天想要点些什么呢？'
    },
    
    // 办公室场景
    office: {
        background: 'assets/images/scene/office.png',
        aiCharacter: {
            name: '同事',
            avatar: {
                idle: 'assets/images/avatars/colleague.png',
                speaking: 'assets/images/avatars/colleague_speaking.webp'
            }
        },
        userCharacter: {
            name: '员工',
            avatar: {
                idle: 'assets/images/avatars/employee.png',
                speaking: 'assets/images/avatars/employee_speaking.webp'
            }
        },
        description: '在办公室场景中，你是一位员工，正在与同事讨论工作相关事项。你可以讨论项目进展、安排会议或解决工作问题。',
        sampleDialogs: [
            '关于这个项目，我们需要讨论一下时间安排。',
            '你能帮我看一下这份报告吗？',
            '下周的会议你有时间参加吗？'
        ],
        welcomeMessage: '欢迎来到办公室！有什么我可以帮助你的吗？'
    },
    
    // 医院场景
    hospital: {
        background: 'assets/images/scene/hospital.png',
        aiCharacter: {
            name: '医生',
            avatar: {
                idle: 'assets/images/avatars/doctor.png',
                speaking: 'assets/images/avatars/doctor_speaking.webp'
            }
        },
        userCharacter: {
            name: '患者',
            avatar: {
                idle: 'assets/images/avatars/patient.png',
                speaking: 'assets/images/avatars/patient_speaking.webp'
            }
        },
        description: '在医院场景中，你是一位患者，正在与医生进行咨询。你可以描述症状、询问治疗方案或讨论健康问题。',
        sampleDialogs: [
            '请告诉我您最近的症状。',
            '我最近感觉头痛，而且有些疲劳。',
            '这种药物需要怎么服用？'
        ],
        welcomeMessage: '您好，欢迎来到医院。请问有什么可以帮助您的吗？'
    }
};

export default scenes; 