export default class RunLetters {
    init() {
        // Ensure functions are available globally for onclick handlers
        window.editLetter = this.editLetter.bind(this);
        window.saveLetter = this.saveLetter.bind(this);
        window.cancelEdit = this.cancelEdit.bind(this);
        window.togglePublic = this.togglePublic.bind(this);
        window.copyShareLink = this.copyShareLink.bind(this);
        window.restoreLetterDisplay = this.restoreLetterDisplay.bind(this);
    }

    editLetter(activityId) {
        const container = document.querySelector('.letter-content-' + activityId);
        const letterTextEl = container.querySelector('.letter-text');
        const currentText = letterTextEl.textContent;

        // Replace with textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full p-3 border border-gray-300 rounded-md focus:ring-strava-orange focus:border-strava-orange';
        textarea.rows = 4;
        textarea.value = currentText;

        container.innerHTML = '';
        container.classList.remove('italic', 'border-l-4', 'border-gray-300', 'pl-4');
        container.appendChild(textarea);

        // Add save/cancel buttons
        const actions = document.createElement('div');
        actions.className = 'flex gap-x-2 mt-2';
        actions.innerHTML = `
            <button onclick="saveLetter('${activityId}', this)"
                    class="px-4 py-2 text-sm font-medium text-white bg-strava-orange rounded-md hover:bg-orange-600">
                Save
            </button>
            <button onclick="cancelEdit('${activityId}', '${currentText.replace(/'/g, "\\'")}')"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
            </button>
        `;
        container.after(actions);

        textarea.focus();
    }

    saveLetter(activityId, button) {
        const container = document.querySelector('.letter-content-' + activityId);
        const textarea = container.querySelector('textarea');
        const newText = textarea.value;

        button.disabled = true;
        button.textContent = 'Saving...';

        fetch('/api/run-letter/' + activityId + '/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: newText})
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                this.restoreLetterDisplay(activityId, data.text);
                container.nextElementSibling.remove(); // Remove action buttons
            }
        })
        .catch(e => {
            alert('Failed to save letter');
            button.disabled = false;
            button.textContent = 'Save';
        });
    }

    cancelEdit(activityId, originalText) {
        this.restoreLetterDisplay(activityId, originalText);
        document.querySelector('.letter-content-' + activityId).nextElementSibling.remove();
    }

    restoreLetterDisplay(activityId, text) {
        const container = document.querySelector('.letter-content-' + activityId);
        container.className = 'letter-content-' + activityId + ' text-base text-gray-700 leading-relaxed italic border-l-4 border-gray-300 pl-4';
        container.innerHTML = '"<span class="letter-text">' + text + '</span>"';
    }

    togglePublic(activityId) {
        const button = document.querySelector('.public-toggle-' + activityId);
        const originalText = button.innerHTML;
        button.disabled = true;

        fetch('/api/run-letter/' + activityId + '/toggle-public', {method: 'POST'})
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                // Update button text
                const isPublic = data.isPublic;
                const newText = isPublic ? 'Make Private' : 'Make Public';
                button.innerHTML = originalText.replace(/(Make Private|Make Public)/, newText);
                button.disabled = false;

                // Find the letter item container
                const letterItem = button.closest('li');

                // Update or add/remove the "Public" badge
                const headerDiv = letterItem.querySelector('.flex.items-center.justify-between');
                let publicBadge = headerDiv.querySelector('.bg-green-100');

                if (isPublic && !publicBadge) {
                    // Add public badge
                    const badge = document.createElement('span');
                    badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
                    badge.textContent = 'Public';
                    headerDiv.appendChild(badge);
                } else if (!isPublic && publicBadge) {
                    // Remove public badge
                    publicBadge.remove();
                }

                // Update or add/remove the "Copy Link" button
                const actionsDiv = button.parentElement;
                // Look for the copy link button by class (works for both server-rendered and JS-created buttons)
                let copyLinkButton = actionsDiv.querySelector('.copy-link-button');

                if (isPublic && data.shareUrl && !copyLinkButton) {
                    // Add copy link button
                    const shareToken = data.shareUrl.replace('/letter/', '');
                    const copyButton = document.createElement('button');
                    copyButton.onclick = () => this.copyShareLink(shareToken);
                    copyButton.className = 'copy-link-button inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-strava-orange border border-transparent rounded-md hover:bg-orange-600';
                    copyButton.innerHTML = `
                        <svg class="w-3 h-3 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/>
                        </svg>
                        Copy Link
                    `;
                    actionsDiv.appendChild(copyButton);
                } else if (!isPublic && copyLinkButton) {
                    // Remove copy link button
                    copyLinkButton.remove();
                }
            }
        })
        .catch(e => {
            alert('Failed to update visibility');
            button.disabled = false;
        });
    }

    copyShareLink(token) {
        const url = window.location.origin + '/letter/' + token;
        navigator.clipboard.writeText(url).then(() => {
            alert('Share link copied to clipboard!');
        });
    }
}
