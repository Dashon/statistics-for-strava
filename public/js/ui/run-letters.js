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
        button.disabled = true;

        fetch('/api/run-letter/' + activityId + '/toggle-public', {method: 'POST'})
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                // Reload page to update UI
                window.location.reload();
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
