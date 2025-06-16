import { supabase } from "../../util/supabaseClient.js"; 

let currentPage = 0;
const limit = 5; 
let totalRecords = 0; 

document.addEventListener("DOMContentLoaded", async () => {
    await fetchTotalRecords();  
    await fetchFaculty();       
});

async function fetchTotalRecords() {
    const { count, error } = await supabase
        .from("faculty")
        .select("fid", { count: "exact", head: true });  

    if (error) {
        console.error("Error fetching total count:", error);
        return;
    }

    totalRecords = count;
}

async function fetchFaculty() {
    const start = currentPage * limit;
    const end = start + limit - 1;

    const { data, error } = await supabase
        .from("faculty")
        .select("fid, name, email, department, contact, birthdate")
        .order("fid", { ascending: true }) 
        .range(start, end);

    if (error) {
        console.error("Error fetching faculty:", error);
        return;
    }

    const tableBody = document.getElementById("facultyTableBody");
    tableBody.innerHTML = "";

    data.forEach(faculty => {
        const row = document.createElement("tr");

        const fidCell = document.createElement("td");
        fidCell.textContent = faculty.fid;

        const nameCell = document.createElement("td");
        nameCell.textContent = faculty.name;

        const emailCell = document.createElement("td");
        emailCell.textContent = faculty.email ? faculty.email : "N/A";

        const deptCell = document.createElement("td");
        deptCell.textContent = faculty.department ? faculty.department : "N/A";

        const actionCell = document.createElement("td");
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => removeFaculty(faculty.fid));
        actionCell.appendChild(removeBtn);

        row.appendChild(fidCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(deptCell);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });

    updatePagination();
}

function updatePagination() {
    document.getElementById("pageNumber").textContent = `Page ${currentPage + 1} of ${Math.ceil(totalRecords / limit)}`;
    document.getElementById("prevPage").disabled = currentPage === 0;
    document.getElementById("nextPage").disabled = (currentPage + 1) * limit >= totalRecords;
}

document.getElementById("prevPage").addEventListener("click", async () => {
    if (currentPage > 0) {
        currentPage--;
        await fetchFaculty();
    }
});

document.getElementById("nextPage").addEventListener("click", async () => {
    if ((currentPage + 1) * limit < totalRecords) {
        currentPage++;
        await fetchFaculty();
    }
});

window.removeFaculty = async (facultyId) => {
    const { error } = await supabase.from("faculty").delete().match({ fid: facultyId });

    if (error) {
        alert("Failed to remove faculty.");
        return;
    }

    alert("Faculty removed successfully!");
    await fetchTotalRecords(); 
    await fetchFaculty(); 
};