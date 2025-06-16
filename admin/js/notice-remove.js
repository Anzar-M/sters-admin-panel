import { supabase } from "../../util/supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
    const loadNotices = async () => {
        try {
            const { data: notices, error } = await supabase
                .from("notice")
                .select("id, title, description, file_url, course:course_id(cid, course_name), semester:semester_id(sid, number)");

            if (error) throw error;

            const tableBody = document.getElementById("noticesTableBody");
            tableBody.innerHTML = "";

            if (!notices || notices.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");
                cell.colSpan = 6;
                cell.textContent = "No notices available";
                row.appendChild(cell);
                tableBody.appendChild(row);
                return;
            }

            for (const notice of notices) {
                const courseName = notice.course ? notice.course.course_name : "N/A";
                const semesterNumber = notice.semester ? notice.semester.number : "N/A";

                const row = document.createElement("tr");

                const titleCell = document.createElement("td");
                titleCell.textContent = notice.title;

                const descCell = document.createElement("td");
                descCell.textContent = notice.description;

                const courseCell = document.createElement("td");
                courseCell.textContent = courseName;

                const semesterCell = document.createElement("td");
                semesterCell.textContent = semesterNumber;

                const fileCell = document.createElement("td");
                const fileLink = document.createElement("a");
                fileLink.href = notice.file_url;
                fileLink.target = "_blank";
                fileLink.textContent = "View File";
                fileCell.appendChild(fileLink);

                const actionCell = document.createElement("td");
                const deleteBtn = document.createElement("button");
                deleteBtn.className = "delete-btn";
                deleteBtn.dataset.id = notice.id;
                deleteBtn.dataset.file = encodeURIComponent(notice.file_url);
                deleteBtn.textContent = "Delete";
                actionCell.appendChild(deleteBtn);

                row.appendChild(titleCell);
                row.appendChild(descCell);
                row.appendChild(courseCell);
                row.appendChild(semesterCell);
                row.appendChild(fileCell);
                row.appendChild(actionCell);

                tableBody.appendChild(row);
            }

            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", async (event) => {
                    if (!confirm("Are you sure you want to delete this notice?")) return;

                    const noticeId = event.target.dataset.id;
                    const fileUrl = decodeURIComponent(event.target.dataset.file);

                    try {
                        await supabase.from("notice").delete().eq("id", noticeId);

                        const url = new URL(fileUrl);
                        const filePath = url.pathname.replace('/storage/v1/object/public/notices/', '');
                        console.log(filePath);

                        const { error: storageError } = await supabase.storage.from("notices").remove([filePath]);

                        if (storageError) {
                            console.error("Error deleting file from storage:", storageError);
                        } else {
                            console.log(`File ${filePath} deleted successfully from storage.`);
                        }

                        loadNotices();
                        alert("Notice deleted successfully!");
                    } catch (error) {
                        console.error("Delete failed:", error);
                        alert("Delete failed. See console for details.");
                    }
                });
            });

        } catch (error) {
            console.error("Error fetching notices:", error);
        }
    };

    loadNotices();
});
