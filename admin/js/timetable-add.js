import { supabase } from "../../util/supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("uploadForm").addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const title = document.getElementById("title").value.trim();
        const description = document.getElementById("description").value.trim();
        const forDate = document.getElementById("forDate").value;
        const fileInput = document.getElementById("fileInput").files[0];

        if (!fileInput) {
            alert("Please select a file.");
            return;
        }

        try {
            // Clean the file name 
            const cleanFileName = fileInput.name.replace(/\s+/g, '_').replace(/[^\w\s.-]/g, '');
        
            const { data, error } = await supabase.storage
                .from("timetable")
                .upload(`timetable/${cleanFileName}`, fileInput, {
                    cacheControl: "3600",
                    upsert: true,
                });
        
            if (error) throw error;
        
            const fileUrl = `${supabase.storageUrl}/object/public/timetable/timetable/${cleanFileName}`;
        

            const { error: dbError } = await supabase
                .from("timetable")
                .insert([{ 
                    title, 
                    description, 
                    for_date: forDate, 
                    file_url: fileUrl, 
                    created_date: new Date().toISOString().split('T')[0]
                }]);

            if (dbError) throw dbError;

            alert("Time-Table uploaded successfully!");
            document.getElementById("uploadForm").reset();
        } catch (error) {
            console.error("Error uploading Time-Table:", error);
            alert("Error uploading Time-Table. Please try again.");
        }
    });
});