import { supabase } from "../../util/supabaseClient.js";

const studentTableBody = document.getElementById("studentTableBody");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageIndicator = document.getElementById("pageIndicator");

let currentPage = 1;
const pageSize = 5;
let totalRecords = 0;

async function fetchStudents(page = 1) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await supabase
        .from("student")
        .select(`
            sid, name, email, course_id, course(course_name)
        `, { count: "exact" })
        .order("sid", { ascending: true })
        .range(start, end);

    if (error) {
        console.error("Error fetching students:", error);
        return;
    }

    totalRecords = count;
    studentTableBody.innerHTML = "";

    data.forEach((student) => {
        const row = document.createElement("tr");

        const sidCell = document.createElement("td");
        sidCell.textContent = student.sid;

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        const emailCell = document.createElement("td");
        emailCell.textContent = student.email;

        const courseCell = document.createElement("td");
        courseCell.textContent = student.course ? student.course.course_name : "N/A";

        const actionCell = document.createElement("td");
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.dataset.id = student.sid;
        removeBtn.textContent = "Remove";

        removeBtn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to remove this student?")) {
                const { error } = await supabase.from("student").delete().eq("sid", student.sid);
                if (error) {
                    console.error("Error deleting student:", error);
                    alert("Failed to remove student.");
                } else {
                    alert("Student removed successfully!");
                    fetchStudents(currentPage);
                }
            }
        });

        actionCell.appendChild(removeBtn);

        row.appendChild(sidCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(courseCell);
        row.appendChild(actionCell);

        studentTableBody.appendChild(row);
    });

    updatePagination(page, totalRecords);
}

function updatePagination(page, totalRecords) {
    const totalPages = Math.ceil(totalRecords / pageSize);

    prevBtn.disabled = page === 1;
    nextBtn.disabled = page >= totalPages || totalRecords === 0;

    pageIndicator.textContent = `Page ${page} of ${totalPages}`;
}

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchStudents(currentPage);
    }
});

nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        fetchStudents(currentPage);
    }
});

fetchStudents();
