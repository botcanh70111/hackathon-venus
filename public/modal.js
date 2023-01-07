/** @format */

const ENUM_MODAL_TYPE = {
  win: 1,
  lose: 2,
  cancel: 3,
  history: 4,
  selectUser: 5,
}

function openModal(modalType = ENUM_MODAL_TYPE.win, winnerName = '', userArr = []) {
  console.log("TVT modalType = " + modalType)
  let title = "";
  let content = "";
  let modal = null;
  let modalContent = null;
  switch (modalType) {
    case ENUM_MODAL_TYPE.win:
      title = 'Alert';
      content = `Player ${winnerName} win!`;
      modal = document.getElementById('myModal');
      modalContent = document.getElementById('modal-content');
      break;
    case ENUM_MODAL_TYPE.history:
      title = 'History';
      let data = JSON.parse(localStorage.getItem('history_data'));
      if(!!data?.length) {
        data.forEach(history => {
          content += `<p>${history}</p>`
        });
      } else {
        content = `<div class="no-data">No Data</div>`;
      }
      
      modal = document.getElementById('history-modal');
      modalContent = document.getElementById('history-modal-content');
    default:
      break;
  }
  // Get the modal
  var modalOverlay = document.getElementById('modal-overlay');
  var modalHeaderTitle = document.getElementById('header-title');
  
  modalHeaderTitle.innerHTML = title;
  modalContent.innerHTML = content;

  modalOverlay.style.display = 'block';
  modal.style.display = "flex";
}

function closeModal(modalType = ENUM_MODAL_TYPE.win) {
  console.log("TVT go to closeModal");
  var modalOverlay = document.getElementById('modal-overlay');
  let modal = null;
  switch (modalType) {
    case ENUM_MODAL_TYPE.win:
      modal = document.getElementById('myModal');
      break;
    case ENUM_MODAL_TYPE.history:
      modal = document.getElementById('history-modal');
      break;
    default:
      break;
  }
  modalOverlay.style.display = 'none';
  modal.style.display = "none";
}
