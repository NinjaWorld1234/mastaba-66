const { db } = require('./server/database.cjs');

async function testAssignment() {
    console.log('Testing Supervisor Assignment Logic...');

    try {
        // 1. Setup Supervisors
        db.prepare("DELETE FROM users WHERE email LIKE 'test_%'").run();

        console.log('Creating supervisors...');
        const s1Id = 'sv1_' + Date.now();
        const s2Id = 'sv2_' + Date.now();

        db.prepare(`
            INSERT INTO users (id, email, password, name, role, supervisor_capacity, supervisor_priority, emailVerified)
            VALUES (?, ?, 'pass', 'Supervisor 1', 'supervisor', 2, 1, 1)
        `).run(s1Id, 'test_sv1@example.com');

        db.prepare(`
            INSERT INTO users (id, email, password, name, role, supervisor_capacity, supervisor_priority, emailVerified)
            VALUES (?, ?, 'pass', 'Supervisor 2', 'supervisor', 2, 2, 1)
        `).run(s2Id, 'test_sv2@example.com');

        // 2. Mock registration logic (since we can't easily call the API here without a running server and fetch)
        function getAssignedSupervisor() {
            const supervisors = db.prepare(`
                SELECT id, supervisor_capacity 
                FROM users 
                WHERE role = 'supervisor' 
                ORDER BY supervisor_priority ASC
            `).all();

            for (const sv of supervisors) {
                const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;
                if (count < sv.supervisor_capacity) {
                    return sv.id;
                }
            }
            return null;
        }

        console.log('Registering Students...');

        // Student 1
        const svForSt1 = getAssignedSupervisor();
        console.log(`Student 1 assigned to: ${svForSt1 === s1Id ? 'Supervisor 1' : 'Wrong!'}`);
        db.prepare("INSERT INTO users (id, email, password, name, supervisor_id) VALUES ('st1', 'test_st1@example.com', 'pass', 'Student 1', ?)").run(svForSt1);

        // Student 2
        const svForSt2 = getAssignedSupervisor();
        console.log(`Student 2 assigned to: ${svForSt2 === s1Id ? 'Supervisor 1' : 'Wrong!'}`);
        db.prepare("INSERT INTO users (id, email, password, name, supervisor_id) VALUES ('st2', 'test_st2@example.com', 'pass', 'Student 2', ?)").run(svForSt2);

        // Student 3
        const svForSt3 = getAssignedSupervisor();
        console.log(`Student 3 assigned to: ${svForSt3 === s2Id ? 'Supervisor 2' : 'Wrong!'}`);
        db.prepare("INSERT INTO users (id, email, password, name, supervisor_id) VALUES ('st3', 'test_st3@example.com', 'pass', 'Student 3', ?)").run(svForSt3);

        console.log('Verification Complete.');

        // Cleanup
        db.prepare("DELETE FROM users WHERE email LIKE 'test_%'").run();
        db.prepare("DELETE FROM users WHERE id IN ('st1', 'st2', 'st3')").run();

    } catch (e) {
        console.error('Verification failed:', e);
    }
}

testAssignment();
