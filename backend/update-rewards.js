const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRewards() {
  console.log('🔄 Updating quest rewards...\n');

  try {
    // Get all quests
    const quests = await prisma.quest.findMany();
    
    console.log(`Found ${quests.length} quests\n`);

    // Update rewards based on difficulty
    for (const quest of quests) {
      let newReward;
      
      if (quest.difficulty.toLowerCase() === 'beginner') {
        newReward = 5;
      } else if (quest.difficulty.toLowerCase() === 'intermediate') {
        newReward = 7;
      } else if (quest.difficulty.toLowerCase() === 'advanced') {
        newReward = 10;
      } else {
        newReward = 5;
      }

      await prisma.quest.update({
        where: { id: quest.id },
        data: { reward: newReward }
      });

      console.log(`✅ ${quest.title}`);
      console.log(`   ${quest.reward} mUSD → ${newReward} mUSD\n`);
    }

    console.log('✅ All rewards updated!');
    console.log('\nNew reward structure:');
    console.log('- Beginner: 5 mUSD');
    console.log('- Intermediate: 7 mUSD');
    console.log('- Advanced: 10 mUSD');
    console.log('\nWith 1,000 mUSD you can now support:');
    console.log('- 200 beginner quests');
    console.log('- 142 intermediate quests');
    console.log('- 100 advanced quests');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRewards();

