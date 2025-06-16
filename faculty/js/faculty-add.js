import { supabase } from "../../util/supabaseClient.js";
document.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("facultyForm").addEventListener("submit", async function (event) {
        // Prevent default form submission
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const birthdate = document.getElementById("birthdate").value.trim();
        const email = document.getElementById("email").value.trim();
        const department = document.getElementById("department").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value;

        // Validate passwords
        /// TODO: passwords are stored in plain text right now.
        // we had to switch from firebase to supabase last minute (firebase spark plan dropped free image hosting)
        // so didn’t have time to set up proper auth or hashing before deadline.
        // fix this in future — hash + salt or move to supabase auth.


        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const { data, error } = await supabase.from("faculty").insert([
                {
                    name,
                    birthdate,
                    email,
                    department,
                    contact,
                    password,
                },

            ], { returning: "minimal" }); // prevents supabase from fetching the inserted row


            if (error) throw error;

            alert("Faculty registered successfully!");
            document.getElementById("facultyForm").reset();
        } catch (error) {
            console.error("Error inserting faculty data:", error);
            alert("Failed to register faculty.");
        }
    });
});