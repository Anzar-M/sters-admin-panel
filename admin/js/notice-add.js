import { supabase } from "../../util/supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadCourses();
    await loadSemesters();

    document.getElementById("uploadForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const fileInput = document.getElementById("fileInput").files[0];
        const courseId = parseInt(document.getElementById("course").value);
        const semesterId = parseInt(document.getElementById("semester").value);

        if (!fileInput) {
            alert("Please select a file.");
            return;
        }

        try {
            const cleanFileName = fileInput.name.replace(/\s+/g, '_').replace(/[^\w\s.-]/g, '');

            const { data, error } = await supabase.storage
                .from("notices")
                .upload(`notices/${cleanFileName}`, fileInput, {
                    cacheControl: "3600",
                    upsert: true,
                });

            if (error) throw error;

            const fileUrl = `${supabase.storageUrl}/object/public/notices/notices/${cleanFileName}`;

            const { error: dbError } = await supabase
                .from("notice")
                .insert([{ title, description, course_id: courseId, semester_id: semesterId, file_url: fileUrl }]);

            if (dbError) throw dbError;

            alert("Notice uploaded successfully!");
            document.getElementById("uploadForm").reset();
        } catch (error) {
            console.error("Error uploading notice:", error);
            alert("Error uploading notice. Please try again.");
        }
    });
});

async function loadCourses() {
    const { data, error } = await supabase.from("course").select("cid, course_name");
    if (error) {
        console.error("Error fetching courses:", error);
        return;
    }

    const courseDropdown = document.getElementById("course");
    data.forEach(course => {
        const option = document.createElement("option");
        option.value = course.cid;
        option.textContent = course.course_name;
        courseDropdown.appendChild(option);
    });
}

async function loadSemesters() {
    const { data, error } = await supabase.from("semester").select("sid, number");
    if (error) {
        console.error("Error fetching semesters:", error);
        return;
    }

    const semesterDropdown = document.getElementById("semester");
    data.forEach(semester => {
        const option = document.createElement("option");
        option.value = semester.sid;
        option.textContent = `Semester ${semester.number}`;
        semesterDropdown.appendChild(option);
    });
}