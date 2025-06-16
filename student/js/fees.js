import { supabase } from "../../util/supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const feesTableBody = document.getElementById("feesTableBody");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageNumberDisplay = document.getElementById("pageNumber");

  let currentPage = 0;
  const limit = 20;

  async function fetchFees() {
    const start = currentPage * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from("student")
      .select("sid, name, email, course_id, fees_status", { count: "exact" }) // fetching total count
      .order("sid", { ascending: true })
      .range(start, end);

    if (error) {
      console.error("Error fetching fees data:", error);
      return;
    }

    feesTableBody.innerHTML = "";

    // Populate table with data
    data.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.sid}</td>
        <td>${student.name}</td>
        <td>${student.email}</td>
        <td>${student.course_id}</td>
        <td class="checkbox-cell">
          <input type="checkbox" class="fees-checkbox" data-id="${student.sid}" ${student.fees_status ? "checked" : ""}>
        </td>
      `;
      feesTableBody.appendChild(row);
    });

    attachCheckboxListeners();

    // Update Pagination UI
    pageNumberDisplay.textContent = `Page ${currentPage + 1}`;
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = end + 1 >= count; // Disable if no more data
  }

  function attachCheckboxListeners() {
    document.querySelectorAll(".fees-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", async (event) => {
        const studentId = event.target.getAttribute("data-id");
        const isPaid = event.target.checked;

        const { error } = await supabase
          .from("student")
          .update({ fees_status: isPaid })
          .eq("sid", studentId);

        if (error) {
          console.error("Error updating fee status:", error);
          alert("Failed to update fee status.");
        } else {
          alert("Fee status updated successfully!");
        }
      });
    });
  }

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      fetchFees();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    currentPage++;
    fetchFees();
  });

  fetchFees();
});