// ==UserScript==
// @name        Ticket-Tracker
// @namespace   Violentmonkey Scripts
// @match       https://company.samanage.com/incidents/*
// @grant       none
// @version     1.4.3
// @author      Juan Diego Gonzalez
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@supabase/supabase-js
// @description 10/19/2022, 6:23:03 PM

// ==/UserScript==

'use strict';

const style = document.createElement('style');
const styleContent = `
html {
	box-sizing: border-box;
}

*,
*:before,
*:after {
	box-sizing: border-box;
}

.button {
  display: none;
	appearance: none;
	background: #16a34a;
	border-radius: 0.25em;
	color: white;
	cursor: pointer;
	font-weight: 500;
	height: 3em;
	line-height: 3em;
	padding: 0 1em;
}

.button:hover {
	background-color: #17ac4e;
}

.details-modal {
	background: #ffffff;
	border-radius: 0.5em;
	box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
	left: 50%;
	max-width: 90%;
	pointer-events: none;
	position: absolute;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 70em;
	text-align: left;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
}

.details-modal .details-modal-close {
	align-items: center;
	color: #111827;
	display: flex;
	height: 4.5em;
	justify-content: center;
	pointer-events: none;
	position: absolute;
	right: 0;
	top: 0;
	width: 4.5em;
}

.details-modal .details-modal-close svg {
	display: block;
}

.details-modal .details-modal-title {
	color: #111827;
	padding: 1.5em 2em;
	pointer-events: all;
	position: relative;
	width: calc(100% - 4.5em);
}

.details-modal .details-modal-title h1 {
	font-size: 1.25rem;
	font-weight: 600;
	line-height: normal;
}

.details-modal .details-modal-content {
	border-top: 1px solid #e0e0e0;
	padding: 2em;
	pointer-events: all;
	overflow: auto;
}

.details-modal-overlay {
	transition: opacity 0.2s ease-out;
	pointer-events: none;
	background: rgba(15, 23, 42, 0.8);
	position: fixed;
	opacity: 0;
	bottom: 0;
	right: 0;
	left: 0;
	top: 0;
}

details[open] .details-modal-overlay {
	pointer-events: all;
	opacity: 0.5;
}

details summary {
	list-style: none;
}

details summary:focus {
	outline: none;
}

details summary::-webkit-details-marker {
	display: none;
}

code {
	font-family: Monaco, monospace;
	line-height: 100%;
	background-color: #2d2d2c;
	padding: 0.1em 0.4em;
	letter-spacing: -0.05em;
	word-break: normal;
	border-radius: 7px;
	color: white;
	font-weight: normal;
	font-size: 1.75rem;
	position: relative;
	top: -2px;
}

.container {
	text-align: center;
	max-width: 40em;
	padding: 2em;
}

.container > h1 {
	font-weight: 700;
	font-size: 2rem;
	line-height: normal;
	color: #111827;
}

.container > p {
	margin-top: 2em;
	margin-bottom: 2em;
}

.container sup {
	font-size: 1rem;
	margin-left: 0.25em;
	opacity: 0.5;
	position: relative;
}`;
style.textContent = styleContent;
document.head.append(style);

const ticketNumber = Number(document.title.slice(1,6));
const ticketURL = window.location.href;
const techId = 1;

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

VM.observe(document.body, () => {
  const userAssignedElement = document.querySelectorAll("span > span > span > span > span > span.username");
  if (userAssignedElement[0]) {
    const assignedUser = userAssignedElement[0].innerText;
    if (assignedUser) {
        // Get top bar menu
        VM.observe(document.body, () => {
            const topMenu = document.querySelectorAll("div#react_entity_app > div > div > div > div")
            if (topMenu) {
              VM.observe(document.body, () => {
                const statusElement = document.querySelectorAll("div#status_pill > div > div > div > div > div > span");
                if (statusElement) {
                  if (statusElement[0].innerText !== 'Resolved' && statusElement[0].innerText !== 'Closed') {
                    const leftMenu = topMenu[0];
                    const assignEl = document.createElement('div');
                    const newTicketForm = `
                      <button type="button" style="margin-left: 20px;" id="submitButton">Assign ticket to me</button>
                    `;
                    let ticketEx = false;
                    const ticketExist = async () => {
                      const { data: tickets, error } = await _supabase
                        .from('tickets')
                        .select('id, status, tech_id')
                        .eq('id', ticketNumber);
                      if (error) {
                        console.error("Failed to retreieve ticket ID");
                      }
                      if (tickets[0]) {
                        const { data: techs, error } = await _supabase
                          .from('techs')
                          .select('name')
                          .eq('id', tickets[0].tech_id);
                        if (error) {
                          console.error("Failed to retreieve ticket ID");
                        } else {
                          VM.observe(document.body, () => {
                            const statuses = document.querySelectorAll("div#status_pill > div > div > div > div > div > ul > div > li");
                            if (statuses) {
                              statuses[0].addEventListener("click", async (event) => {
                                  const { data, error } = await _supabase
                                    .from('tickets')
                                    .update({ status: statuses[0].innerText })
                                    .eq('id', ticketNumber)
                                  if (error) {
                                    alert("Failed updating ticket: ", error);
                                  } else {
                                    console.log('Ticket updated');
                                  }
                                }, false);
                              statuses[1].addEventListener("click", async (event) => {
                                  const { data, error } = await _supabase
                                    .from('tickets')
                                    .update({ status: statuses[1].innerText })
                                    .eq('id', ticketNumber)
                                  if (error) {
                                    alert("Failed updating ticket: ", error);
                                  } else {
                                    console.log('Ticket updated');
                                  }
                                }, false);
                              statuses[2].addEventListener("click", async (event) => {
                                  const { data, error } = await _supabase
                                    .from('tickets')
                                    .update({ status: statuses[2].innerText })
                                    .eq('id', ticketNumber)
                                  if (error) {
                                    alert("Failed updating ticket: ", error);
                                  } else {
                                    console.log('Ticket updated');
                                  }
                                }, false);
                              statuses[3].addEventListener("click", async (event) => {
                                  const { data, error } = await _supabase
                                    .from('tickets')
                                    .update({ status: statuses[3].innerText })
                                    .eq('id', ticketNumber)
                                  if (error) {
                                    alert("Failed updating ticket: ", error);
                                  } else {
                                    console.log('Ticket updated');
                                  }
                                }, false);
                              statuses[4].addEventListener("click", async (event) => {
                                  const { data, error } = await _supabase
                                    .from('tickets')
                                    .update({ status: statuses[4].innerText })
                                    .eq('id', ticketNumber)
                                  if (error) {
                                    alert("Failed updating ticket: ", error);
                                  } else {
                                    console.log('Ticket updated');
                                  }
                                }, false);
                            }
                            // disconnect observer
                            // return true;
                          });
                          /* VM.observe(document.body, () => {
                            const statuses = document.querySelectorAll("div#status_pill > div > div > div > div > div > ul > div > li");
                            const assignedUser = userAssignedElement;
                            if (assignedUser) {
                              TODO: Handle transfers to resolve ticket?
                            }
                            // disconnect observer
                            // return true;
                          }); */
                          if (tickets[0].tech_id === techId) {
                            const ticketExistForm = `
                              <div style="font-size: 12px; margin-left: 20px; color: black;">
                                <strong>Ticket assigned to ${techs[0].name}</strong><br>
                                <a id="remove-assignment" href="#">Remove assignment</a>
                              </div>`;
                            assignEl.innerHTML = ticketExistForm;
                            VM.observe(document.body, () => {
                              const delAssLink = document.querySelectorAll("a#remove-assignment");
                              if (delAssLink) {
                                delAssLink[0].addEventListener("click", async () => {
                                  const { data, error } = await _supabase
                                    .from('tickets')
                                    .delete()
                                    .eq('id', ticketNumber)
                                  if (error) {
                                    alert("Failed removing ticket assignment", error);
                                  } else {
                                    location.reload();
                                    return false;
                                  }
                                });
                                return true;
                              }
                            });
                          } else {
                            const ticketExistForm = `
                              <div style="margin-left: 20px; color: black;">
                                <strong>Ticket assigned to ${techs[0].name}</strong><br>
                              </div>
                            `;
                            assignEl.innerHTML = ticketExistForm;
                          }
                        }
                      } else {
                        assignEl.innerHTML = newTicketForm;
                        VM.observe(document.body, () => {
                          const btn = document.querySelectorAll("button#submitButton");
                          if (btn) {
                            btn[0].addEventListener("click", () => {
                              const user = document.querySelectorAll("span > span > span > span > span > span.username");
                              if (user[0].innerText === 'OrbisOne Help Desk') {
                                  const categoriesEl = document.querySelectorAll("div.wrapperController > div > div > span > span");
                                  if (categoriesEl) {
                                    if (confirm(`Are the categories correct?\n${categoriesEl[2].innerText} --> ${categoriesEl[3].innerText}`)) {
                                      (async () => {
                                        const { data, error } = await _supabase
                                          .from('tickets')
                                          .insert([
                                            { id: ticketNumber, tech_id: techId, status: statusElement[0].innerText, category: categoriesEl[2].innerText, sub_category: categoriesEl[3].innerText },
                                          ])
                                        if (error) {
                                          console.error("Failed creating ticket row", error);
                                        } else {
                                          location.reload();
                                        }
                                      })();
                                    }
                                    return true;
                                  }
                              } else {
                                alert("You must first assign the ticket to OrbisOne");
                              }
                            });
                          }
                          // disconnect observer
                          return true;
                        });
                      }
                    };
                    ticketExist();
                    leftMenu.append(assignEl);
                  }
                  VM.observe(document.body, () => {
                    const infoElement = document.querySelectorAll("div#entity_content");
                    if (infoElement) {
                      const noteSection = document.createElement('div');
                      const displayNotes = async () => {
                        const { data: notes, error } = await _supabase
                          .from('notes')
                          .select('id, note, created_at, tech_id(id, name)')
                          .eq('ticket_id', ticketNumber);
                        if (error) {
                          console.error("Failed to retreieve ticket ID");
                        } else {
                          if (notes) {
                            noteSection.innerHTML = `
                              <hr>
                              <h2>Ticket Notes:</h2>
                            `;
                            notes.map((note) => {
                              const commentDate = new Date(note.created_at);
                              const commentText = note.note.split(/\r?\n/);
                              let comments = '';
                              commentText.map((line) => {
                                comments += `<p style="font-size: 14px;">${line}</p>`;
                              });
                              console.log(note.tech_id);
                              if (note.tech_id.id === techId) {
                                noteSection.innerHTML += `
                                  <div id="note-${note.id}" style="background-color: #f9f9f9; margin-bottom: 10px; padding: 10px;">
                                    <h3 style="margin-bottom: 1px;">${note.tech_id.name}</h3>
                                    <span>Date: ${commentDate.toLocaleString()}</span>
                                    ${comments}
                                    <button id="del-note${note.id}">Delete Note</button>
                                  </div>`;
                                VM.observe(document.body, () => {
                                  const delNoteBtn = document.querySelectorAll(`button#del-note${note.id}`);
                                  const noteDiv = document.querySelectorAll(`div#note-${note.id}`);
                                  if (delNoteBtn && noteDiv) {
                                    delNoteBtn[0].addEventListener("click", async () => {
                                      const { data, error } = await _supabase
                                        .from('notes')
                                        .delete()
                                        .eq('id', note.id)
                                      if (error) {
                                        alert("Error deleting note: ", error)
                                      } else {
                                        noteDiv[0].remove();
                                      }
                                    });
                                    // disconnect observer
                                    return true;
                                  }
                                });
                              } else {
                                noteSection.innerHTML += `
                                  <div id="note-${note.id}" style="background-color: #f9f9f9; margin-bottom: 10px; padding: 10px;">
                                    <h3 style="margin-bottom: 1px;">${note.tech_id.name}</h3>
                                    <span>Date: ${commentDate.toLocaleString()}</span>
                                    ${comments}
                                  </div>`;
                              }
                            });
                          }
                        }
                      };
                      const newBtn = document.createElement('div');
                      const newNoteModalContent = `
                        <details>
                          <summary>
                            <div class="button" id="newNoteBtn">
                              Show me the modal
                            </div>
                            <div class="details-modal-overlay"></div>
                          </summary>
                          <div class="details-modal">
                            <div class="details-modal-close">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7071 1.70711C14.0976 1.31658 14.0976 0.683417 13.7071 0.292893C13.3166 -0.0976311 12.6834 -0.0976311 12.2929 0.292893L7 5.58579L1.70711 0.292893C1.31658 -0.0976311 0.683417 -0.0976311 0.292893 0.292893C-0.0976311 0.683417 -0.0976311 1.31658 0.292893 1.70711L5.58579 7L0.292893 12.2929C-0.0976311 12.6834 -0.0976311 13.3166 0.292893 13.7071C0.683417 14.0976 1.31658 14.0976 1.70711 13.7071L7 8.41421L12.2929 13.7071C12.6834 14.0976 13.3166 14.0976 13.7071 13.7071C14.0976 13.3166 14.0976 12.6834 13.7071 12.2929L8.41421 7L13.7071 1.70711Z" fill="black" />
                              </svg>
                            </div>
                            <div class="details-modal-title">
                              <h1>Add Note</h1>
                            </div>
                            <div class="details-modal-content">
                              <textarea id="note-content" name="note-content" cols="50" placeholder="Note content..."></textarea>
                              <button id="noteAdd">Publish Note</button>
                            </div>
                          </div>
                        </details>`;
                      const vdom = VM.h('div', { innerHTML: newNoteModalContent, id: 'container' }, '');
                      document.body.append(VM.m(vdom));
                      VM.observe(document.body, () => {
                        const newNoteBtn = document.querySelectorAll("div#newNoteBtn");
                        const addNoteBtn = document.querySelectorAll("button#noteAdd");
                        const noteContent = document.querySelectorAll("textarea#note-content");
                        if (newNoteBtn && addNoteBtn && noteContent) {
                          newBtn.addEventListener("click", async () => {
                            document.getElementById("newNoteBtn").click();
                          });
                          addNoteBtn[0].addEventListener("click", async () => {
                            const { data: notes, error } = await _supabase
                              .from('notes')
                              .insert([
                                { ticket_id: ticketNumber, tech_id: techId, note: noteContent[0].value },
                              ])
                              .select()
                            if (error) {
                              alert("Error adding note: ", error)
                            } else {
                              location.reload();
                              return false;
                            }
                          });
                          // disconnect observer
                          return true;
                        }
                      });
                      displayNotes();
                      infoElement[0].append(noteSection);
                      newBtn.innerHTML = '<button>Add Note</button>';
                      infoElement[0].append(newBtn);
                      // disconnect observer
                      return true;
                    }
                  });
                  // disconnect observer
                  return true;
                }
              });
            }
          // disconnect observer
          return true;
        });
    }
    // disconnect observer
    return true;
  }
});
