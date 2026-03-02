import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'uz' | 'en' | 'ru';

interface Translations {
  [key: string]: {
    uz: string;
    en: string;
    ru: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.dashboard': { uz: 'Dashboard', en: 'Dashboard', ru: 'Панель' },
  'nav.tests': { uz: 'Testlar', en: 'Tests', ru: 'Тесты' },
  'nav.admin': { uz: 'Admin', en: 'Admin', ru: 'Админ' },
  'nav.signIn': { uz: 'Kirish', en: 'Sign in', ru: 'Войти' },
  'nav.getStarted': { uz: 'Boshlash', en: 'Get Started', ru: 'Начать' },
  'nav.signOut': { uz: 'Chiqish', en: 'Sign out', ru: 'Выйти' },
  'nav.profile': { uz: 'Profil', en: 'Profile', ru: 'Профиль' },
  'nav.adminPanel': { uz: 'Admin paneli', en: 'Admin Panel', ru: 'Панель админа' },
  
  // Auth
  'auth.createAccount': { uz: 'Hisob yaratish', en: 'Create an account', ru: 'Создать аккаунт' },
  'auth.welcomeBack': { uz: 'Xush kelibsiz', en: 'Welcome back', ru: 'С возвращением' },
  'auth.chooseUsername': { uz: 'Foydalanuvchi nomini tanlang', en: 'Choose a username to get started', ru: 'Выберите имя пользователя' },
  'auth.signInWith': { uz: 'Foydalanuvchi nomi bilan kiring', en: 'Sign in with your username', ru: 'Войдите с именем пользователя' },
  'auth.username': { uz: 'Foydalanuvchi nomi', en: 'Username', ru: 'Имя пользователя' },
  'auth.password': { uz: 'Parol', en: 'Password', ru: 'Пароль' },
  'auth.confirmPassword': { uz: 'Parolni tasdiqlang', en: 'Confirm Password', ru: 'Подтвердите пароль' },
  'auth.phoneOrEmail': { uz: 'Telefon raqami yoki email', en: 'Phone number or email', ru: 'Номер телефона или email' },
  'auth.phoneHint': { uz: 'O\'zbekiston raqami: +998 XX XXX XX XX. Email ham qabul qilinadi.', en: 'Uzbekistan format: +998 XX XXX XX XX. Email is also accepted.', ru: 'Формат Узбекистана: +998 XX XXX XX XX. Email тоже принимается.' },
  'auth.createAccountBtn': { uz: 'Hisob yaratish', en: 'Create Account', ru: 'Создать аккаунт' },
  'auth.signInBtn': { uz: 'Kirish', en: 'Sign In', ru: 'Войти' },
  'auth.alreadyHaveAccount': { uz: 'Hisobingiz bormi?', en: 'Already have an account?', ru: 'Уже есть аккаунт?' },
  'auth.dontHaveAccount': { uz: 'Hisobingiz yo\'qmi?', en: "Don't have an account?", ru: 'Нет аккаунта?' },
  'auth.signUp': { uz: 'Ro\'yxatdan o\'tish', en: 'Sign up', ru: 'Регистрация' },
  'auth.signInFailed': { uz: 'Kirish muvaffaqiyatsiz', en: 'Sign in failed', ru: 'Ошибка входа' },
  'auth.invalidCredentials': { uz: 'Noto\'g\'ri foydalanuvchi nomi yoki parol.', en: 'Invalid username or password. Please try again.', ru: 'Неверное имя пользователя или пароль.' },
  'auth.signInSuccess': { uz: 'Muvaffaqiyatli kirdingiz.', en: 'You have successfully signed in.', ru: 'Вы успешно вошли.' },
  'auth.signUpFailed': { uz: 'Ro\'yxatdan o\'tish muvaffaqiyatsiz', en: 'Sign up failed', ru: 'Ошибка регистрации' },
  'auth.usernameTaken': { uz: 'Bu foydalanuvchi nomi band. Boshqasini tanlang.', en: 'This username is already taken. Please choose another.', ru: 'Это имя пользователя уже занято.' },
  'auth.accountCreated': { uz: 'Hisob yaratildi!', en: 'Account created!', ru: 'Аккаунт создан!' },
  'auth.canSignIn': { uz: 'Endi foydalanuvchi nomingiz bilan kirishingiz mumkin.', en: 'You can now sign in with your username.', ru: 'Теперь вы можете войти с именем пользователя.' },
  
  // Home page
  'home.tagline': { uz: 'Zamonaviy test platformasi', en: 'Modern Test Management Platform', ru: 'Современная платформа тестирования' },
  'home.title1': { uz: 'Testlarni yarating va yechimlar', en: 'Create & Take Tests with', ru: 'Создавайте и проходите тесты с' },
  'home.title2': { uz: 'Matematik aniqlik bilan', en: 'Mathematical Precision', ru: 'Математической точностью' },
  'home.description': { uz: 'Vizual tenglamalar muharriri, keng qamrovli tahlil va foydalanuvchi tajribasiga ega matematik testlar yaratish uchun kuchli platforma.', en: 'A powerful platform for creating math-based tests with visual equation editing, comprehensive analytics, and seamless user experience.', ru: 'Мощная платформа для создания математических тестов с визуальным редактором уравнений, комплексной аналитикой и удобным интерфейсом.' },
  'home.getStartedFree': { uz: 'Bepul boshlash', en: 'Get Started Free', ru: 'Начать бесплатно' },
  'home.goToDashboard': { uz: 'Dashboard\'ga o\'tish', en: 'Go to Dashboard', ru: 'Перейти в Dashboard' },
  'home.whyChoose': { uz: 'Nima uchun TIM-Test?', en: 'Why Choose TIM-Test?', ru: 'Почему TIM-Test?' },
  'home.whyChooseDesc': { uz: 'Murakkab matematik yozuv qo\'llab-quvvatlash bilan testlarni yaratish, boshqarish va o\'tkazish uchun zarur bo\'lgan hamma narsa.', en: 'Everything you need to create, manage, and take tests with support for complex mathematical notation.', ru: 'Все необходимое для создания, управления и прохождения тестов с поддержкой сложных математических обозначений.' },
  'home.richMath': { uz: 'Boy matematik qo\'llab-quvvatlash', en: 'Rich Math Support', ru: 'Поддержка математики' },
  'home.richMathDesc': { uz: 'Murakkab matematik tenglamalar, kasrlar va belgilar bilan savollar yarating.', en: 'Create questions with complex mathematical equations, fractions, and symbols.', ru: 'Создавайте вопросы со сложными математическими уравнениями, дробями и символами.' },
  'home.instantResults': { uz: 'Tezkor natijalar', en: 'Instant Results', ru: 'Мгновенные результаты' },
  'home.instantResultsDesc': { uz: 'Testni tugatgandan so\'ng batafsil tahlil bilan ballingizni darhol oling.', en: 'Get your score immediately after completing a test with detailed analytics.', ru: 'Получайте результат сразу после завершения теста с подробной аналитикой.' },
  'home.multiUser': { uz: 'Ko\'p foydalanuvchi qo\'llab-quvvatlash', en: 'Multi-User Support', ru: 'Многопользователь' },
  'home.multiUserDesc': { uz: 'Testlarni ma\'lum foydalanuvchilarga tayinlang yoki ularni hamma uchun ochiq qiling.', en: 'Assign tests to specific users or make them public for everyone.', ru: 'Назначайте тесты конкретным пользователям или делайте их публичными.' },
  'home.builtFor': { uz: 'O\'qituvchilar va o\'quvchilar uchun yaratilgan', en: 'Built for Educators & Students', ru: 'Создано для учителей и учеников' },
  'home.builtForDesc': { uz: 'Siz baholashlar yaratayotgan o\'qituvchi bo\'lasizmi yoki imtihonlarga tayyorlanayotgan o\'quvchi bo\'lasizmi, TIM-Test silliq test tajribasi uchun barcha vositalarni taqdim etadi.', en: "Whether you're an educator creating assessments or a student preparing for exams, TIM-Test provides all the tools you need for a seamless testing experience.", ru: 'Являетесь ли вы преподавателем, создающим оценки, или учеником, готовящимся к экзаменам, TIM-Test предоставляет все инструменты для бесперебойного тестирования.' },
  'home.readyToStart': { uz: 'Boshlashga tayyormisiz?', en: 'Ready to Get Started?', ru: 'Готовы начать?' },
  'home.joinToday': { uz: 'Bugun TIM-Testga qo\'shiling va to\'liq matematik qo\'llab-quvvatlash bilan onlayn testlarning kelajagini his qiling.', en: 'Join TIM-Test today and experience the future of online testing with full mathematical support.', ru: 'Присоединяйтесь к TIM-Test сегодня и испытайте будущее онлайн-тестирования с полной математической поддержкой.' },
  'home.createFreeAccount': { uz: 'Bepul hisob yaratish', en: 'Create Free Account', ru: 'Создать бесплатный аккаунт' },
  
  // Features list
  'feature.visualEditor': { uz: 'Oson matematik kiritish uchun vizual tenglama muharriri', en: 'Visual equation editor for easy math input', ru: 'Визуальный редактор уравнений для легкого ввода математики' },
  'feature.imageSupport': { uz: 'Savollarda rasmlarni qo\'llab-quvvatlash', en: 'Support for images in questions', ru: 'Поддержка изображений в вопросах' },
  'feature.realTimeProgress': { uz: 'Real vaqtda progress kuzatish', en: 'Real-time progress tracking', ru: 'Отслеживание прогресса в реальном времени' },
  'feature.adminDashboard': { uz: 'Keng qamrovli admin paneli', en: 'Comprehensive admin dashboard', ru: 'Комплексная панель администратора' },
  'feature.darkMode': { uz: 'Qorong\'u va yorug\' rejim mavzulari', en: 'Dark and light mode themes', ru: 'Темная и светлая темы' },
  'feature.responsive': { uz: 'Mobil qurilmalarga moslashtirilgan dizayn', en: 'Mobile-friendly responsive design', ru: 'Адаптивный дизайн для мобильных устройств' },
  
  // Dashboard
  'dashboard.welcomeBack': { uz: 'Xush kelibsiz!', en: 'Welcome back!', ru: 'С возвращением!' },
  'dashboard.overview': { uz: 'Test faoliyatingiz va mavjud testlarning umumiy ko\'rinishi.', en: "Here's an overview of your test activity and available tests.", ru: 'Обзор вашей тестовой активности и доступных тестов.' },
  'dashboard.testsCompleted': { uz: 'Tugatilgan testlar', en: 'Tests Completed', ru: 'Пройдено тестов' },
  'dashboard.totalTests': { uz: 'Jami o\'tilgan testlar', en: 'Total tests taken', ru: 'Всего пройдено тестов' },
  'dashboard.averageScore': { uz: 'O\'rtacha ball', en: 'Average Score', ru: 'Средний балл' },
  'dashboard.acrossAllTests': { uz: 'Barcha testlar bo\'yicha', en: 'Across all tests', ru: 'По всем тестам' },
  'dashboard.timeSpent': { uz: 'Sarflangan vaqt', en: 'Time Spent', ru: 'Затраченное время' },
  'dashboard.totalTestingTime': { uz: 'Jami test vaqti', en: 'Total testing time', ru: 'Общее время тестирования' },
  'dashboard.recentResults': { uz: 'So\'nggi natijalar', en: 'Recent Results', ru: 'Последние результаты' },
  'dashboard.latestSubmissions': { uz: 'Oxirgi yuborilgan testlar', en: 'Your latest test submissions', ru: 'Ваши последние отправленные тесты' },
  'dashboard.noResults': { uz: 'Hali natijalar yo\'q', en: 'No test results yet', ru: 'Пока нет результатов' },
  'dashboard.takeTestToSee': { uz: 'Natijalarni ko\'rish uchun test yechimini boshlang', en: 'Take a test to see your results here', ru: 'Пройдите тест, чтобы увидеть результаты' },
  'dashboard.availableTests': { uz: 'Mavjud testlar', en: 'Available Tests', ru: 'Доступные тесты' },
  'dashboard.testsYouCanTake': { uz: 'Hozir o\'tkazishingiz mumkin bo\'lgan testlar', en: 'Tests you can take now', ru: 'Тесты, которые вы можете пройти' },
  'dashboard.viewAll': { uz: 'Hammasini ko\'rish', en: 'View All', ru: 'Показать все' },
  'dashboard.noTestsAvailable': { uz: 'Mavjud testlar yo\'q', en: 'No tests available', ru: 'Нет доступных тестов' },
  'dashboard.checkBackLater': { uz: 'Yangi testlar uchun keyinroq tekshiring', en: 'Check back later for new tests', ru: 'Проверьте позже новые тесты' },
  'dashboard.adminPanel': { uz: 'Admin paneli', en: 'Admin Panel', ru: 'Панель администратора' },
  'dashboard.manageTests': { uz: 'Testlarni boshqaring, barcha natijalarni ko\'ring va foydalanuvchilarga testlarni tayinlang', en: 'Manage tests, view all results, and assign tests to users', ru: 'Управляйте тестами, просматривайте все результаты и назначайте тесты пользователям' },
  'dashboard.openAdminPanel': { uz: 'Admin panelini ochish', en: 'Open Admin Panel', ru: 'Открыть панель админа' },
  
  // Tests
  'tests.availableTests': { uz: 'Mavjud testlar', en: 'Available Tests', ru: 'Доступные тесты' },
  'tests.browseTests': { uz: 'Testlarni ko\'rib chiqing va o\'z mahoratingizni oshiring', en: 'Browse and take tests to improve your skills', ru: 'Просматривайте и проходите тесты для улучшения навыков' },
  'tests.searchTests': { uz: 'Testlarni qidirish...', en: 'Search tests...', ru: 'Поиск тестов...' },
  'tests.assignedToYou': { uz: 'Sizga tayinlangan', en: 'Assigned to You', ru: 'Назначено вам' },
  'tests.publicTests': { uz: 'Umumiy testlar', en: 'Public Tests', ru: 'Публичные тесты' },
  'tests.noTests': { uz: 'Testlar topilmadi', en: 'No tests found', ru: 'Тесты не найдены' },
  'tests.noOlympiads': { uz: 'Olimpiadalar topilmadi', en: 'No olympiads found', ru: 'Олимпиады не найдены' },
  'tests.adjustSearch': { uz: 'Qidiruv so\'rovingizni o\'zgartirib ko\'ring', en: 'Try adjusting your search query', ru: 'Попробуйте изменить поисковый запрос' },
  'tests.questions': { uz: 'savollar', en: 'questions', ru: 'вопросов' },
  'tests.minutes': { uz: 'daqiqa', en: 'min', ru: 'мин' },
  'tests.startTest': { uz: 'Testni boshlash', en: 'Start Test', ru: 'Начать тест' },
  'tests.assigned': { uz: 'Tayinlangan', en: 'Assigned', ru: 'Назначен' },
  'tests.practice': { uz: 'Mashqlar', en: 'Practice', ru: 'Практика' },
  'tests.olympiad': { uz: 'Olimpiadalar', en: 'Olympiads', ru: 'Олимпиады' },
  
  // Take Test
  'takeTest.question': { uz: 'Savol', en: 'Question', ru: 'Вопрос' },
  'takeTest.of': { uz: 'dan', en: 'of', ru: 'из' },
  'takeTest.answered': { uz: 'javob berildi', en: 'answered', ru: 'отвечено' },
  'takeTest.remaining': { uz: 'qoldi', en: 'remaining', ru: 'осталось' },
  'takeTest.previous': { uz: 'Oldingi', en: 'Previous', ru: 'Назад' },
  'takeTest.next': { uz: 'Keyingi', en: 'Next', ru: 'Далее' },
  'takeTest.submitTest': { uz: 'Testni yuborish', en: 'Submit Test', ru: 'Отправить тест' },
  'takeTest.submitQuestion': { uz: 'Testni yuborasizmi?', en: 'Submit Test?', ru: 'Отправить тест?' },
  'takeTest.answeredCount': { uz: 'ta savolga javob berdingiz', en: 'questions answered', ru: 'вопросов отвечено' },
  'takeTest.unansweredWarning': { uz: 'ta savolga javob berilmagan', en: 'unanswered questions', ru: 'вопросов без ответа' },
  'takeTest.continueTest': { uz: 'Testni davom ettirish', en: 'Continue Test', ru: 'Продолжить тест' },
  'takeTest.submitting': { uz: 'Yuborilmoqda...', en: 'Submitting...', ru: 'Отправка...' },
  'takeTest.completed': { uz: 'Test yakunlandi!', en: 'Test Completed!', ru: 'Тест завершён!' },
  'takeTest.backToTests': { uz: 'Testlarga qaytish', en: 'Back to Tests', ru: 'Вернуться к тестам' },
  'takeTest.enterAnswer': { uz: 'Javobingizni kiriting...', en: 'Enter your answer...', ru: 'Введите ваш ответ...' },
  
  // Admin
  'admin.overview': { uz: 'Umumiy ko\'rinish', en: 'Overview', ru: 'Обзор' },
  'admin.tests': { uz: 'Testlar', en: 'Tests', ru: 'Тесты' },
  'admin.users': { uz: 'Foydalanuvchilar', en: 'Users', ru: 'Пользователи' },
  'admin.results': { uz: 'Natijalar', en: 'Results', ru: 'Результаты' },
  'admin.settings': { uz: 'Sozlamalar', en: 'Settings', ru: 'Настройки' },
  'admin.backToApp': { uz: 'Ilovaga qaytish', en: 'Back to App', ru: 'Назад в приложение' },
  'admin.dashboardOverview': { uz: 'Dashboard ko\'rinishi', en: 'Dashboard Overview', ru: 'Обзор Dashboard' },
  'admin.welcomeAdmin': { uz: 'Admin paneliga xush kelibsiz. Platformangiz haqida qisqacha ma\'lumot.', en: "Welcome to the admin panel. Here's a summary of your platform.", ru: 'Добро пожаловать в панель администратора. Вот сводка вашей платформы.' },
  'admin.totalTests': { uz: 'Jami testlar', en: 'Total Tests', ru: 'Всего тестов' },
  'admin.testsCreated': { uz: 'Yaratilgan testlar', en: 'Tests created', ru: 'Создано тестов' },
  'admin.totalUsers': { uz: 'Jami foydalanuvchilar', en: 'Total Users', ru: 'Всего пользователей' },
  'admin.registeredUsers': { uz: 'Ro\'yxatdan o\'tgan foydalanuvchilar', en: 'Registered users', ru: 'Зарегистрированных' },
  'admin.testResults': { uz: 'Test natijalari', en: 'Test Results', ru: 'Результаты тестов' },
  'admin.submissionsReceived': { uz: 'Qabul qilingan natijalar', en: 'Submissions received', ru: 'Получено отправок' },
  'admin.quickActions': { uz: 'Tezkor harakatlar', en: 'Quick Actions', ru: 'Быстрые действия' },
  'admin.commonTasks': { uz: 'Umumiy ma\'muriy vazifalar', en: 'Common administrative tasks', ru: 'Общие административные задачи' },
  'admin.createNewTest': { uz: 'Yangi test yaratish', en: 'Create New Test', ru: 'Создать новый тест' },
  'admin.addTestQuestions': { uz: 'Savollar bilan yangi test qo\'shish', en: 'Add a new test with questions', ru: 'Добавить новый тест с вопросами' },
  'admin.viewLeaderboard': { uz: 'Yetakchilar jadvalini ko\'rish', en: 'View Leaderboard', ru: 'Посмотреть лидеров' },
  'admin.seeTopPerformers': { uz: 'Eng yaxshi ishtirokchilarni ko\'ring', en: 'See top performers', ru: 'Смотреть лучших' },
  'admin.manageUsers': { uz: 'Foydalanuvchilarni boshqarish', en: 'Manage Users', ru: 'Управление пользователями' },
  'admin.viewManageUsers': { uz: 'Foydalanuvchi hisoblarini ko\'rish va boshqarish', en: 'View and manage user accounts', ru: 'Просмотр и управление пользователями' },
  'admin.platformStatus': { uz: 'Platforma holati', en: 'Platform Status', ru: 'Статус платформы' },
  'admin.systemHealth': { uz: 'Tizim salomatligi va ma\'lumotlar', en: 'System health and information', ru: 'Состояние системы и информация' },
  'admin.database': { uz: 'Ma\'lumotlar bazasi', en: 'Database', ru: 'База данных' },
  'admin.connected': { uz: 'Ulangan', en: 'Connected', ru: 'Подключена' },
  'admin.authentication': { uz: 'Autentifikatsiya', en: 'Authentication', ru: 'Аутентификация' },
  'admin.active': { uz: 'Faol', en: 'Active', ru: 'Активна' },
  'admin.storage': { uz: 'Saqlash', en: 'Storage', ru: 'Хранилище' },
  'admin.available': { uz: 'Mavjud', en: 'Available', ru: 'Доступно' },
  'admin.posts': { uz: 'Postlar', en: 'Posts', ru: 'Публикации' },
  'admin.managePosts': { uz: 'Bosh sahifa postlarini boshqarish', en: 'Manage homepage posts', ru: 'Управление публикациями' },
  
  // Admin Users
  'adminUsers.title': { uz: 'Foydalanuvchilar', en: 'Users', ru: 'Пользователи' },
  'adminUsers.manageAccounts': { uz: 'Foydalanuvchi hisoblarini va rollarini boshqarish', en: 'Manage user accounts and roles', ru: 'Управление аккаунтами и ролями' },
  'adminUsers.searchUsers': { uz: 'Foydalanuvchilarni qidirish...', en: 'Search users...', ru: 'Поиск пользователей...' },
  'adminUsers.totalUsers': { uz: 'Jami foydalanuvchilar', en: 'Total Users', ru: 'Всего пользователей' },
  'adminUsers.administrators': { uz: 'Administratorlar', en: 'Administrators', ru: 'Администраторы' },
  'adminUsers.allUsers': { uz: 'Barcha foydalanuvchilar', en: 'All Users', ru: 'Все пользователи' },
  'adminUsers.user': { uz: 'Foydalanuvchi', en: 'User', ru: 'Пользователь' },
  'adminUsers.username': { uz: 'Foydalanuvchi nomi', en: 'Username', ru: 'Имя пользователя' },
  'adminUsers.role': { uz: 'Rol', en: 'Role', ru: 'Роль' },
  'adminUsers.joined': { uz: 'Qo\'shilgan', en: 'Joined', ru: 'Дата регистрации' },
  'adminUsers.actions': { uz: 'Harakatlar', en: 'Actions', ru: 'Действия' },
  'adminUsers.admin': { uz: 'Admin', en: 'Admin', ru: 'Админ' },
  'adminUsers.superAdmin': { uz: 'Bosh Admin', en: 'Super Admin', ru: 'Главный админ' },
  'adminUsers.regularUser': { uz: 'Oddiy foydalanuvchi', en: 'Regular User', ru: 'Обычный пользователь' },
  'adminUsers.manage': { uz: 'Boshqarish', en: 'Manage', ru: 'Управление' },
  'adminUsers.manageUser': { uz: 'Foydalanuvchini boshqarish', en: 'Manage User', ru: 'Управление пользователем' },
  'adminUsers.updateSettings': { uz: 'Sozlamalarni yangilash', en: 'Update settings for', ru: 'Обновить настройки для' },
  'adminUsers.currentRole': { uz: 'Joriy rol', en: 'Current Role', ru: 'Текущая роль' },
  'adminUsers.cancel': { uz: 'Bekor qilish', en: 'Cancel', ru: 'Отмена' },
  'adminUsers.removeAdminRole': { uz: 'Admin rolini olib tashlash', en: 'Remove Admin Role', ru: 'Убрать роль админа' },
  'adminUsers.makeAdmin': { uz: 'Adminni tayinlash', en: 'Make Admin', ru: 'Сделать админом' },
  'adminUsers.resetPassword': { uz: 'Parolni tiklash', en: 'Reset Password', ru: 'Сбросить пароль' },
  'adminUsers.noUsers': { uz: 'Foydalanuvchilar topilmadi', en: 'No users found', ru: 'Пользователи не найдены' },
  
  // Posts
  'posts.title': { uz: 'Postlar', en: 'Posts', ru: 'Публикации' },
  'posts.manageHomepage': { uz: 'Bosh sahifa postlarini boshqarish', en: 'Manage homepage posts', ru: 'Управление публикациями главной страницы' },
  'posts.newPost': { uz: 'Yangi post', en: 'New Post', ru: 'Новая публикация' },
  'posts.editPost': { uz: 'Postni tahrirlash', en: 'Edit Post', ru: 'Редактировать' },
  'posts.postTitle': { uz: 'Sarlavha', en: 'Title', ru: 'Заголовок' },
  'posts.content': { uz: 'Matn', en: 'Content', ru: 'Содержание' },
  'posts.published': { uz: 'Nashr qilingan', en: 'Published', ru: 'Опубликовано' },
  'posts.draft': { uz: 'Qoralama', en: 'Draft', ru: 'Черновик' },
  'posts.save': { uz: 'Saqlash', en: 'Save', ru: 'Сохранить' },
  'posts.delete': { uz: 'O\'chirish', en: 'Delete', ru: 'Удалить' },
  'posts.noPosts': { uz: 'Hozircha postlar yo\'q', en: 'No posts yet', ru: 'Пока нет публикаций' },
  'posts.createFirst': { uz: 'Birinchi postingizni yarating', en: 'Create your first post', ru: 'Создайте первую публикацию' },
  'posts.latestNews': { uz: 'So\'nggi yangiliklar', en: 'Latest News', ru: 'Последние новости' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    if (stored === 'uz' || stored === 'en' || stored === 'ru') {
      return stored;
    }
    return 'uz';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
