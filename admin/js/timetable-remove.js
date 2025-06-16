import { supabase } from "../../util/supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
    const loadTimetables = async () => {
        try {
            const { data: timetables, error } = await supabase
                .from("timetable")
                .select("id, title, description, file_url");

            if (error) throw error;

            const tableBody = document.getElementById("timetableTableBody");
            tableBody.innerHTML = "";

            if (timetables?.length) {
                timetables.forEach(timetable => {
                    const row = document.createElement("tr");

                    const titleCell = document.createElement("td");
                    titleCell.textContent = timetable.title;

                    const descCell = document.createElement("td");
                    descCell.textContent = timetable.description;

                    const fileCell = document.createElement("td");
                    const fileLink = document.createElement("a");
                    fileLink.href = timetable.file_url;
                    fileLink.target = "_blank";
                    fileLink.textContent = "View File";
                    fileCell.appendChild(fileLink);

                    const actionCell = document.createElement("td");
                    const deleteBtn = document.createElement("button");
                    deleteBtn.className = "delete-btn";
                    deleteBtn.dataset.id = timetable.id;
                    deleteBtn.dataset.file = encodeURIComponent(timetable.file_url);
                    deleteBtn.textContent = "Delete";
                    actionCell.appendChild(deleteBtn);

                    row.appendChild(titleCell);
                    row.appendChild(descCell);
                    row.appendChild(fileCell);
                    row.appendChild(actionCell);

                    tableBody.appendChild(row);
                });

                document.querySelectorAll(".delete-btn").forEach(button => {
                    button.addEventListener("click", async (event) => {
                        if (!confirm("Are you sure you want to delete this timetable?")) return;
                        
                        const timetableId = event.target.dataset.id;
                        const fileUrl = decodeURIComponent(event.target.dataset.file);

                        try {
                            await supabase.from("timetable").delete().eq("id", timetableId);
                            
                            const url = new URL(fileUrl);
                            const filePath = url.pathname.replace('/storage/v1/object/public/timetable/', '');
                            await supabase.storage.from('timetable').remove([filePath]);
                            
                            loadTimetables();
                            alert("Deleted successfully!");
                        } catch (error) {
                            console.error("Delete failed:", error);
                            alert("Delete failed. See console for details.");
                        }
                    });
                });
            } else {
                tableBody.innerHTML = "<tr><td colspan='4'>No timetables available</td></tr>";
            }
        } catch (error) {
            console.error("Error loading timetables:", error);
        }
    };

    loadTimetables();
});