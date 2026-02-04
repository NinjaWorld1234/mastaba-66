const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
async function check() {
    const res = await fetch('http://localhost:5000/api/courses');
    const courses = await res.json();
    console.log('Sample course folderId:', courses[0].folderId);
    console.log('Courses count:', courses.length);
}
check();
