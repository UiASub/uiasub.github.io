document.addEventListener('DOMContentLoaded', function () {
  const membersContainer = document.getElementById('members-container');
  if (!membersContainer) return;

  // Determine language
  const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/en/');

  // Define group order and titles
  const groups = [
    { id: 'leadership', title_no: 'Ledelse', title_en: 'Leadership' },
    { id: 'data', title_no: 'Data', title_en: 'Data' },
    { id: 'electronics', title_no: 'Elektronikk', title_en: 'Electronics' },
    { id: 'mechanical', title_no: 'Mekanisk', title_en: 'Mechanical' },
    { id: 'marketing', title_no: 'Markedsføring', title_en: 'Marketing' },
    { id: 'members', title_no: 'Medlemmer', title_en: 'Members' }
  ];

  fetch('/data/members.json')
    .then(response => response.json())
    .then(members => {
      groups.forEach(group => {
        // Filter members for this group
        const groupMembers = members.filter(m => m.group === group.id);

        if (groupMembers.length > 0) {
          // Create section header
          const sectionTitle = isEnglish ? group.title_en : group.title_no;
          const sectionHeader = document.createElement('div');
          sectionHeader.className = 'col-12 mt-5 mb-3';
          sectionHeader.innerHTML = `<h3 class="text-white text-center border-bottom pb-2" style="border-color: rgba(255,255,255,0.1) !important;">${sectionTitle}</h3>`;
          membersContainer.appendChild(sectionHeader);

          // Render members
          groupMembers.forEach(member => {
            // Select role based on language
            const role = isEnglish ? (member.role_en || member.role_no) : member.role_no;

            // Handle placeholder name translation
            let name = member.name;
            if (isEnglish && name === 'Medlem') {
              name = 'Member';
            }

            const memberCard = document.createElement('div');
            memberCard.className = 'col-md-4';
            memberCard.setAttribute('data-id', member.id);
            memberCard.innerHTML = `
              <div class="card h-100">
                <img src="/images/profie_shared/${member.image}" loading="lazy" decoding="async" class="card-img-top" alt="${name}">
                <div class="card-body">
                  <h5 class="card-title text-white">${name}</h5>
                  <h6 class="card-subtitle mb-2 text-white-50">${role}</h6>
                </div>
              </div>
            `;
            membersContainer.appendChild(memberCard);
          });
        }
      });
    })
    .catch(error => console.error('Error loading members:', error));
});