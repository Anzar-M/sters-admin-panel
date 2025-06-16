import { supabase } from "../../util/supabaseClient.js";
async function loadDropdowns() {
  try {
    const { data: courses, error: coursesError } = await supabase.from("course").select("*");
    if (coursesError) throw coursesError;

    const { data: semesters, error: semestersError } = await supabase.from("semester").select("*");
    if (semestersError) throw semestersError;

    const { data: divisions, error: divisionsError } = await supabase.from("division").select("*");
    if (divisionsError) throw divisionsError;

    const courseSelect = document.getElementById("course");
    courses.forEach(course => {
      const option = document.createElement("option");
      option.value = course.cid;
      option.textContent = course.course_name;
      courseSelect.appendChild(option);
    });

    const semesterSelect = document.getElementById("semester");
    const uniqueSemesters = [...new Set(semesters.map(semester => semester.number))];
    uniqueSemesters.forEach(semester => {
      const option = document.createElement("option");
      option.value = semester;
      option.textContent = semester;
      semesterSelect.appendChild(option);
    });

    const divisionSelect = document.getElementById("division");
    divisions.forEach(division => {
      const option = document.createElement("option");
      option.value = division.did;
      option.textContent = division.division_name;
      divisionSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error loading dropdown data:", error);
  }
}

document.getElementById("studentForm").addEventListener("submit", async function (event) {
  event.preventDefault(); 

  const name = document.getElementById("name").value;
  const birthdate = document.getElementById("birthdate").value;
  const email = document.getElementById("email").value;
  const courseId = parseInt(document.getElementById("course").value);
  const contact = document.getElementById("contact").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const semesterId = parseInt(document.getElementById("semester").value);
  const divisionId = parseInt(document.getElementById("division").value);

  // Validate passwords
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  //TODO: AGAIN hash and salt the password in future versions

  const { data, error } = await supabase.from("student").insert([
    {
      name,
      birthdate,
      email,
      course_id: courseId,
      contact,
      password,
      semester_id: semesterId,
      division_id: divisionId,
    },
  ]);

  if (error) {
    console.error("Error inserting data:", error);
    alert("Failed to register student.");
  } else {
    alert("Student registered successfully!");
    document.getElementById("studentForm").reset();   }
});

loadDropdowns();
