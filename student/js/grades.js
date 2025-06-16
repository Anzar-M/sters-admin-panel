import { supabase } from '../../util/supabaseClient.js';

let selectedCourse = null;
let selectedSemester = null;
let selectedSubject = null;
let selectedDivision = null;

let students = [];
let currentPage = 1;
const studentsPerPage = 10;

let gradeEntries = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCourses();

  document.getElementById('courseSelect').addEventListener('change', async (e) => {
    selectedCourse = parseInt(e.target.value);
    selectedSemester = null;
    selectedSubject = null;
    selectedDivision = null;
    clearDropdowns(['semesterSelect', 'subjectSelect', 'divisionSelect']);
    hideGradesTable();
    if (selectedCourse) await loadSemesters(selectedCourse);
  });

  document.getElementById('semesterSelect').addEventListener('change', async (e) => {
    selectedSemester = parseInt(e.target.value);
    selectedSubject = null;
    selectedDivision = null;
    clearDropdowns(['divisionSelect', 'subjectSelect']);
    hideGradesTable();

    if (selectedCourse && selectedSemester) {
      await loadSubjects(selectedCourse, selectedSemester);
      await loadDivisions(selectedCourse, selectedSemester);
    }
  });

  document.getElementById('divisionSelect').addEventListener('change', async (e) => {
    selectedDivision = parseInt(e.target.value);
    selectedSubject = null;
    clearDropdowns(['subjectSelect']);
    hideGradesTable();

    if (selectedCourse && selectedSemester && selectedDivision) {
      await loadSubjects(selectedCourse, selectedSemester);
    }
  });

  document.getElementById('subjectSelect').addEventListener('change', async (e) => {
    selectedSubject = parseInt(e.target.value);
    hideGradesTable();

    if (
      selectedCourse &&
      selectedSemester &&
      selectedDivision !== null && !isNaN(selectedDivision) &&
      selectedSubject
    ) {
      await loadStudents(selectedCourse, selectedSemester, selectedDivision);
    }
  });

  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderStudentTable();
      updatePaginationButtons();
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(students.length / studentsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderStudentTable();
      updatePaginationButtons();
    }
  });

  document.getElementById('gradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitGrades();
  });
});

function hideGradesTable() {
  document.getElementById('gradesTableContainer').style.display = 'none';
}

function showGradesTable() {
  document.getElementById('gradesTableContainer').style.display = 'block';
}

async function submitGrades() {
  let errors = [];
  const currentDate = new Date().toISOString().split('T')[0];

  const dataToInsert = students.map((student) => {
    const entry = gradeEntries[student.sid] || { internal: '' };

    if (entry.internal === '') {
      errors.push(`Missing internal marks for ${student.name}`);
      return null;
    }

    const internal = parseInt(entry.internal);
    if (isNaN(internal) || internal < 0 || internal > 50) {
      errors.push(`Invalid internal marks for ${student.name} (must be 0-50)`);
      return null;
    }

    return {
      student_id: student.sid,
      subject_id: selectedSubject,
      semester_id: selectedSemester,
      course_id: selectedCourse,
      division_id: selectedDivision,
      internal_marks: internal,
      created_at: currentDate,
      updated_at: currentDate
    };
  }).filter(Boolean);

  if (errors.length > 0) {
    alert('Please fix the following errors:\n\n' + errors.join('\n'));
    return;
  }

  try {
    const { error } = await supabase.from('grades').insert(dataToInsert);

    if (error) {
      if (error.message && error.message.includes('duplicate')) {
        alert('Error: Some grades already exist for this student/subject/semester combination');
      } else {
        throw error;
      }

    } else {
      alert('Grades submitted successfully!');
      gradeEntries = {};
      renderStudentTable();
    }
  } catch (error) {
    console.error('Error submitting grades:', error);
    alert('Failed to submit grades: ' + error.message);
  }
}

function clearDropdowns(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<option value="">Select ${id.replace('Select', '')}</option>`;
    el.disabled = true;
  });
}

async function loadCourses() {
  try {
    const { data, error } = await supabase.from('course').select('cid, course_name');
    if (error) throw error;

    const courseSelect = document.getElementById('courseSelect');
    courseSelect.innerHTML = '<option value="">Select Course</option>';
    data.forEach(course => {
      courseSelect.innerHTML += `<option value="${course.cid}">${course.course_name}</option>`;
    });
  } catch (error) {
    console.error('Error loading courses:', error);
    alert('Failed to load courses: ' + error.message);
  }
}

async function loadSemesters(courseId) {
  try {
    const { data, error } = await supabase
      .from('semester')
      .select('sid, number')
      .order('number', { ascending: true });

    if (error) throw error;

    const semesterSelect = document.getElementById('semesterSelect');
    semesterSelect.innerHTML = '<option value="">Select Semester</option>';
    data.forEach(sem => {
      semesterSelect.innerHTML += `<option value="${sem.sid}">Semester ${sem.number}</option>`;
    });
    semesterSelect.disabled = false;
  } catch (error) {
    console.error('Error loading semesters:', error);
    alert('Failed to load semesters: ' + error.message);
  }
}

async function loadDivisions(courseId, semesterId) {
  try {
    const { data, error } = await supabase
      .from('student')
      .select('division_id, division(division_name)')
      .eq('course_id', courseId)
      .eq('semester_id', semesterId);

    if (error) throw error;

    const uniqueDivisions = new Map();
    data.forEach(row => {
      if (row.division && !uniqueDivisions.has(row.division_id)) {
        uniqueDivisions.set(row.division_id, row.division.division_name);
      }
    });

    const divisionSelect = document.getElementById('divisionSelect');
    divisionSelect.innerHTML = '<option value="">Select Division</option>';
    uniqueDivisions.forEach((name, id) => {
      divisionSelect.innerHTML += `<option value="${id}">${name}</option>`;
    });
    divisionSelect.disabled = false;
  } catch (error) {
    console.error('Error loading divisions:', error);
    alert('Failed to load divisions: ' + error.message);
  }
}

async function loadSubjects(courseId, semesterId) {
  try {
    const { data, error } = await supabase
      .from('subject')
      .select('subject_code, name')
      .eq('course_id', courseId)
      .eq('semester_id', semesterId);

    if (error) throw error;

    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    data.forEach(subject => {
      subjectSelect.innerHTML += `<option value="${subject.subject_code}">${subject.name}</option>`;
    });
    subjectSelect.disabled = false;
  } catch (error) {
    console.error('Error loading subjects:', error);
    alert('Failed to load subjects: ' + error.message);
  }
}

async function loadStudents(courseId, semesterId, divisionId) {
  if (
    typeof courseId !== 'number' ||
    typeof semesterId !== 'number' ||
    typeof divisionId !== 'number'
  ) {
    console.warn('loadStudents called with invalid params:', {
      courseId, semesterId, divisionId
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('student')
      .select('sid, name')
      .eq('course_id', courseId)
      .eq('semester_id', semesterId)
      .eq('division_id', divisionId)
      .order('name', { ascending: true });

    if (error) throw error;

    students = data;
    currentPage = 1;
    gradeEntries = {};

    if (students.length > 0) {
      showGradesTable();
      renderStudentTable();
      updatePaginationButtons();
    } else {
      hideGradesTable();
      alert('No students found for this course, semester, and division');
    }
  } catch (error) {
    console.error('Error loading students:', error);
    alert('Failed to load students: ' + error.message);
  }
}

function renderStudentTable() {
  const studentTableBody = document.getElementById('studentTableBody');
  if (!studentTableBody) return;

  studentTableBody.innerHTML = '';

  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, students.length);
  const currentStudents = students.slice(startIndex, endIndex);

  currentStudents.forEach(student => {
    const entry = gradeEntries[student.sid] || { internal: '' };
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${student.name}</td>
      <td>
        <input type="number"
               value="${entry.internal}"
               min="0" max="50"
               data-sid="${student.sid}"
               data-type="internal"
               class="marks-input"
               required />
      </td>
    `;

    studentTableBody.appendChild(row);
  });

  document.querySelectorAll('.marks-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const sid = parseInt(e.target.dataset.sid);
      const type = e.target.dataset.type;
      const value = e.target.value;
      updateEntry(sid, type, value);
    });
  });
}

function updateEntry(sid, type, value) {
  if (!gradeEntries[sid]) {
    gradeEntries[sid] = { internal: '' };
  }
  gradeEntries[sid][type] = value;
}

function updatePaginationButtons() {
  const totalPages = Math.ceil(students.length / studentsPerPage);
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  const paginationDiv = document.querySelector('.pagination-buttons');
  if (paginationDiv) {
    paginationDiv.style.display = totalPages <= 1 ? 'none' : 'flex';
  }
}