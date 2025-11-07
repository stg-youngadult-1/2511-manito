function makePairs(normals, newbies, leaders) {

    // 모든 참가자를 하나의 배열로 합치기
    const allParticipants = [
        ...normals.map(name => ({ name, type: 'normal' })),
        ...newbies.map(name => ({ name, type: 'newbie' })),
        ...leaders.map(name => ({ name, type: 'leader' }))
    ];

    if (allParticipants.length === 0) {
        return [];
    }

    if (allParticipants.length === 1) {
        throw new Error('참가자가 1명뿐이어서 쌍을 만들 수 없습니다.');
    }

    // 참가자 수가 홀수인 경우 처리
    if (allParticipants.length % 2 !== 0) {
        console.warn(`참가자 수가 홀수입니다 (${allParticipants.length}명). 한 명은 제외됩니다.`);
    }

    // Fisher-Yates 알고리즘으로 배열 섞기
    const shuffled = [...allParticipants];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 원형 배치로 쌍 생성 (각자 정확히 1명의 giver, 1명의 receiver)
    const pairs = [];
    const participantCount = Math.floor(shuffled.length / 2) * 2; // 짝수 개수만 사용

    for (let i = 0; i < participantCount; i++) {
        const giver = shuffled[i];
        const receiver = shuffled[(i + 1) % participantCount];

        pairs.push({
            id: i + 1,
            giver: giver.name,
            giverType: giver.type,
            receiver: receiver.name,
            receiverType: receiver.type,
            createdAt: new Date().toISOString()
        });
    }

    // 제외된 참가자가 있으면 로그 출력
    if (shuffled.length > participantCount) {
        const excluded = shuffled.slice(participantCount);
        console.warn('제외된 참가자:', excluded.map(p => `${p.name} (${p.type})`));
    }

    return {
        pairs,
        metadata: {
            totalParticipants: allParticipants.length,
            usedParticipants: participantCount,
            excludedParticipants: shuffled.length - participantCount,
            excluded: shuffled.length > participantCount ?
                shuffled.slice(participantCount).map(p => ({ name: p.name, type: p.type })) : [],
            generatedAt: new Date().toISOString()
        }
    };
}

export {
    makePairs,
};