import { supabase } from "../../util/supabaseClient.js";
let currentPage = 0;
const limit = 10;
document.addEventListener("DOMContentLoaded", () => {
    loadStudents();

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 0) {
            currentPage--;
            loadStudents();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        currentPage++;
        loadStudents();
    });

    document.getElementById("exportBtn").addEventListener("click", exportCSV);
    document.getElementById("importForm").addEventListener("submit", importCSV);
});

async function loadStudents() {
    const { data, error } = await supabase
        .from("student")
        .select(`
            sid, name, birthdate, email, 
            course(course_name), contact, password, 
            semester(number), division(division_name), fees_status, created_at, updated_at
        `)
        .order("sid", { ascending: true })
        .range(currentPage * limit, (currentPage + 1) * limit - 1);

    if (error) {
        console.error("Error loading students:", error);
        return;
    }

    // filtering null records
    updateTable(data.filter(student => student.sid !== null));

    document.getElementById("prevPage").disabled = currentPage === 0;
    document.getElementById("nextPage").disabled = data.length < limit;
}

function updateTable(students) {
    const tbody = document.getElementById("studentTable").querySelector("tbody");
    // Clear table before adding new rows
    tbody.innerHTML = "";

    students.forEach(student => {
        // ignore any null records
        if (!student.sid) return;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student.sid}</td>
            <td>${student.name}</td>
            <td>${student.birthdate}</td>
            <td>${student.email}</td>
            <td>${student.course?.course_name || "N/A"}</td>
            <td>${student.contact}</td>
            <td>${student.password}</td>
            <td>${student.semester?.number || "N/A"}</td>
            <td>${student.division?.division_name || "N/A"}</td>
            <td>${student.fees_status ? "Paid" : "Unpaid"}</td>
            <td>${student.created_at}</td>
            <td>${student.updated_at}</td>
        `;
        tbody.appendChild(row);
    });
}

async function exportCSV() {
    let allData = [];
    let start = 0;
    const batchSize = 1000;
    while (true) {
        const { data, error } = await supabase
            .from("student")
            .select(`
                sid, name, birthdate, email, 
                course(course_name), contact, password, 
                semester(number), division(division_name), fees_status, created_at, updated_at
            `)
            .order("sid", { ascending: true })
            // fetch records in batches
            .range(start, start + batchSize - 1); 
            if (error) {
                console.error("Error exporting data:", error);
                return;
            }

        if (!data.length) break;
        allData = allData.concat(data);
        start += batchSize;
    }

    if (allData.length === 0) {
        alert("No records found to export.");
        return;
    }

    // flatten nested objects for CSV formatting
    const formattedData = allData.map(student => ({
        sid: student.sid,
        name: student.name,
        birthdate: student.birthdate,
        email: student.email,
        course_name: student.course ? student.course.course_name : '',
        contact: student.contact,
        password: student.password,
        semester: student.semester ? student.semester.number : '',
        division: student.division ? student.division.division_name : '',
        fees_status: student.fees_status ? "Paid" : "Unpaid",
        created_at: student.created_at,
        updated_at: student.updated_at
    }));

    const csvContent = Papa.unparse(formattedData, { quotes: true });

    // create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "student_data.csv");
    document.body.appendChild(link);
    link.click();
}


async function importCSV(event) {
    event.preventDefault();

    const file = document.getElementById("csvFileInput").files[0];
    if (!file) return alert("Please select a CSV file.");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const parsedData = Papa.parse(e.target.result, { header: true }).data;

        // filter out empty rows
        const csvData = parsedData
            .map(row => {
                const currentDate = new Date().toISOString();
                return {
                    name: row.name?.trim(),
                    birthdate: row.birthdate?.trim(),
                    email: row.email?.trim(),
                    course_id: row.course_id ? parseInt(row.course_id) : null,
                    contact: row.contact?.trim(),
                    password: row.password?.trim(),
                    semester_id: row.semester_id ? parseInt(row.semester_id) : null,
                    division_id: row.division_id ? parseInt(row.division_id) : null,
                    fees_status: row.fees_status === "true",
                    created_at: row.created_at || currentDate,
                    updated_at: row.updated_at || currentDate
                };
            })
            // check if required fields exist
            .filter(row => row.name && row.email && row.course_id); 

        if (csvData.length === 0) {
            alert("No valid records found in CSV.");
            return;
        }

        const { error } = await supabase.from("student").insert(csvData);
        if (error) {
            console.error("Error importing CSV:", error);
            alert("Import failed!");
        } else {
            alert("Import successful!");
            loadStudents();
        }
    };

    reader.readAsText(file);
}