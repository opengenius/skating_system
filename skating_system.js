/***********************************************************************************************************************
 * Skating system calculation
 *
 * https://en.wikipedia.org/wiki/Skating_system
 * https://tadance.ru/Article/Details/14
 ***********************************************************************************************************************/

 function calc_majority(count) {
    return Math.floor(count / 2) + 1;
  }
  
  function get_row_count_and_sum(row, columnPlace) {
    let count = 0;
    let placeSum = 0;
    for (place of row) {
      if (place <= columnPlace) {
        count += 1;
        placeSum += place;
      }
    }
    return {count: count, placeSum: placeSum};
  }
  
  function sorted_place_counts(scores, pairIndices, placeToCheck) {
    let placeCounts = pairIndices.map(pairIndex => ({
      index: pairIndex,
      counts: get_row_count_and_sum(scores[pairIndex], placeToCheck)
    }));
    placeCounts.sort((e1, e2) => (e1.counts.count !== e2.counts.count ? e2.counts.count - e1.counts.count : e1.counts.placeSum - e2.counts.placeSum));
    return placeCounts;
  }
  
  function equal_counts_range_size(placeCounts) {
    let equalRangeSize = 1;
    for (let i = equalRangeSize; i < placeCounts.length; ++i) {
      if (placeCounts[0].counts.count === placeCounts[i].counts.count &&
        placeCounts[0].counts.placeSum === placeCounts[i].counts.placeSum) {
          equalRangeSize += 1;
      } else break;
    }
    return equalRangeSize;
  }
  
  function distribute_equal_sum_places(scores, pairIndices, placeToCheck, placeCount) {
    if (placeCount < placeToCheck) {
      // no scores to compare, share places
      let shared_place = (pairIndices.length - 1) * 0.5;
      return pairIndices.map(index => ({index: index, place: shared_place}));
    }
  
    let placeCounts = sorted_place_counts(scores, pairIndices, placeToCheck);
  
    let assignedPlace = 0;
    let places = [];
    while(placeCounts.length > 0) {
      let equalRangeSize = equal_counts_range_size(placeCounts);
      let equalSumIndices = placeCounts.splice(0, equalRangeSize).map(e => e.index);
  
      if (equalRangeSize == 1) {
        places.push({index: equalSumIndices[0], place: assignedPlace});
      } else {
        for (pairPlace of distribute_equal_sum_places(scores, equalSumIndices, placeToCheck + 1, placeCount)) {
          places.push({index: pairPlace.index, place: assignedPlace + pairPlace.place});
        }
      }
      assignedPlace += equalRangeSize;
    }
  
    return places;
  }
  
  function calc_skating_dance(scores, startingPlace) {
    if (!scores) return 0;
  
    let placeCount = scores.length;
    if (placeCount === 0) return 0;
  
    let judgeCount = scores[0].length;
    let judgeMajorityCount = calc_majority(judgeCount);
  
    // init
    let res = Array(placeCount).fill(0);
  
    // calculation table iteration
    let currentPlace = 1;
    for (let columnPlace = startingPlace; columnPlace < startingPlace + placeCount; ++columnPlace) {
      // update counts
      let pairPlaceCounts = scores.map((row, index) => (res[index] === 0 ? get_row_count_and_sum(row, columnPlace).count : 0));
  
      // check for majority
      let passedMajority = pairPlaceCounts
        .map((count, index) => ({index: index, count: count}))
        .filter(entry => entry.count >= judgeMajorityCount);
      
      if (passedMajority.length == 0) continue;
      
      if (passedMajority.length >= 1) {
        for (pairPlace of distribute_equal_sum_places(scores, passedMajority.map(e => e.index), columnPlace, startingPlace - 1 + placeCount)) {
          res[pairPlace.index] = currentPlace + pairPlace.place;
        }
        currentPlace += passedMajority.length;
        passedMajority = [];
      }
    }
  
    return res;
  }
  
  function calc_skating(scores) {
    return calc_skating_dance(scores, 1);
  }
  
  function distribute_equal_sum_final_places(scores, pairIndices, placeToCheck, allDancesScores) {
    let assignedPlace = 0;
    let places = [];
    while(pairIndices.length > 0) {
      if (pairIndices.length === 1) {
        places.push({index: pairIndices[0], place: assignedPlace});
        pairIndices = [];
        break;
      }
  
      let placeCounts = sorted_place_counts(scores, pairIndices, placeToCheck + assignedPlace);
      let equalRangeSize = equal_counts_range_size(placeCounts);
      let equalSumIndices = placeCounts.splice(0, equalRangeSize).map(e => e.index);
  
      if (equalRangeSize == 1) {
        places.push({index: equalSumIndices[0], place: assignedPlace});
        
      } else {
        // apply rule 11
        let equalSumIndicesAllDancesScores = equalSumIndices.map(index => allDancesScores[index]);
        let allDancesPlaces = calc_skating_dance(equalSumIndicesAllDancesScores, placeToCheck + assignedPlace);
  
        const minReducer = (accumulator, currentValue) => Math.min(accumulator, currentValue);
        const minPlace = allDancesPlaces.reduce(minReducer);
  
        // assign first place
        let firstPlaceIndices = allDancesPlaces
                                  .map((place, arrayIndex) => ({place: place, index: equalSumIndices[arrayIndex]}))
                                  .filter(e => e.place === minPlace)
                                  .map(e => e.index);
        places = places.concat(firstPlaceIndices.map((index) => ({index: index, place: assignedPlace})));
  
        // apply 10+11 for the rest of the group
        let restIndicesInGroup = equalSumIndices.filter(index => !firstPlaceIndices.includes(index));
        if (restIndicesInGroup.length > 0) {
          let nextAssignedPlace = assignedPlace + firstPlaceIndices.length;
          let nextPlaceToCheck = placeToCheck + nextAssignedPlace;
          for (pairPlace of distribute_equal_sum_final_places(scores, restIndicesInGroup, nextPlaceToCheck, allDancesScores)) {
            places.push({index: pairPlace.index, place: nextAssignedPlace + pairPlace.place});
          }
        }
      }
  
      assignedPlace += equalRangeSize;
      pairIndices = placeCounts.map(e => e.index);
      
    }
  
    return places;
  }
  
  function calc_skating_final(scores, allDancesScores) {
    if (!scores) return 0;
  
    let placeCount = scores.length;
    if (placeCount === 0) return 0;
  
    // init
    let res = Array(placeCount).fill(0);
  
    const sumReducer = (accumulator, currentValue) => accumulator + currentValue;
    let placeSums = scores.map( (row, index) => ({index: index, sum: row.reduce(sumReducer)}));
    placeSums.sort((e1, e2) => (e1.sum - e2.sum));
  
    let currentPlace = 1;
    while(placeSums.length > 0) {
      let equalRangeSize = 1;
      for (let i = equalRangeSize; i < placeSums.length; ++i) {
        if (placeSums[0].sum === placeSums[i].sum) {
            equalRangeSize += 1;
        } else break;
      }
  
      let equalSumIndices = placeSums.splice(0, equalRangeSize).map(e => e.index);
      for (pairPlace of distribute_equal_sum_final_places(scores, equalSumIndices, currentPlace, allDancesScores)) {
        res[pairPlace.index] = currentPlace + pairPlace.place;
      }
      currentPlace += equalSumIndices.length;
    }
    return res;
  }
  
  /***********************************************************************************************************************
   * tests
   ***********************************************************************************************************************/
  
  const array_equals = (a, b) =>
    a.length === b.length &&
    a.every((v, i) => v === b[i]);
  
  function expect_array_equals(name, result, expected) {
    let equals = array_equals(result, expected);
    console.log(name + ': ' + (equals ? "passed" : "failed, result=" + JSON.stringify(result) + " expected=" + JSON.stringify(expected)));
  }
  
  function expect_equals(name, result, expected) {
    let equals = result === expected;
    console.log(name + ': ' + (equals ? "passed" : "failed, result=" + JSON.stringify(result) + " expected=" + JSON.stringify(expected)));
  }
  
  function test_calc_majority() {
    expect_equals("test_calc_majority", calc_majority(5), 3);
    expect_equals("test_calc_majority2", calc_majority(7), 4);
    expect_equals("test_calc_majority3", calc_majority(6), 4);
  }
  
  function test_clear_majority() {
    let scores = [
      [1, 1, 1, 2, 1],
      [2, 2, 2, 1, 2],
      [3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5]
    ];
    expect_array_equals('test_clear_majority', calc_skating(scores), [1, 2, 3, 4, 5]);
  
    // rule 5
    scores = [
      [3, 3, 3, 2, 3],
      [6, 6, 6, 6, 5],
      [2, 2, 5, 4, 1],
      [4, 4, 2, 3, 4],
      [1, 5, 1, 1, 2],
      [5, 1, 4, 5, 6]
    ];
    expect_array_equals('test_clear_majority2', calc_skating(scores), [3,6,2,4,1,5]);
  }
  
  function test_multiple_majority() {
    let scores = [
      [1, 1, 1, 5, 2],
      [2, 3, 3, 1, 1],
      [3, 2, 2, 2, 5],
      [4, 4, 5, 3, 3],
      [5, 5, 4, 4, 4]
    ];
    expect_array_equals('test_multiple_majority', calc_skating(scores), [1, 2, 3, 4, 5]);
  
    // rule 6
    scores = [
      [5, 3, 3, 4, 5],
      [2, 2, 5, 5, 2],
      [4, 4, 1, 1, 1],
      [3, 5, 4, 3, 4],
      [1, 1, 2, 2, 3],
      [6, 6, 6, 6, 6]
    ];
    expect_array_equals('test_multiple_majority2', calc_skating(scores), [5,3,1,4,2,6]);
  
    scores = [
      [1, 1, 3, 3, 5, 2, 3],
      [3, 4, 1, 1, 2, 1, 1],
      [4, 2, 2, 2, 3, 3, 4],
      [6, 5, 4, 6, 4, 6, 5],
      [2, 3, 5, 4, 1, 5, 2],
      [5, 6, 6, 5, 6, 4, 6]
    ];
    expect_array_equals('test_multiple_majority3', calc_skating(scores), [2,1,3,5,4,6]);
  
    // rule 7a
    scores = [
      [4, 6, 6, 6, 6],
      [5, 5, 1, 1, 1],
      [6, 1, 3, 3, 4],
      [1, 4, 2, 2, 5],
      [2, 2, 5, 5, 2],
      [3, 3, 4, 4, 3]
    ];
    expect_array_equals('test_multiple_majority4', calc_skating(scores), [6,1,4,2,3,5]);
  }
  
  function test_no_majority() {
    let scores = [
      [1, 1, 2, 2, 3],
      [2, 2, 1, 1, 2],
      [3, 3, 3, 3, 1]
    ];
    expect_array_equals('test_no_majority', calc_skating(scores), [2, 1, 3]);
  }
  
  function test_equal_sum_majority() {
    // rule 7b
    let scores = [
      [5, 3, 5, 4, 6, 5, 2],
      [3, 1, 4, 3, 5, 1, 1],
      [1, 4, 2, 2, 2, 3, 4],
      [2, 2, 3, 1, 4, 2, 3],
      [4, 5, 1, 5, 1, 4, 6],
      [6, 6, 6, 6, 3, 6, 5]
    ];
    expect_array_equals('test_equal_sum_majority', calc_skating(scores), [5, 3, 2, 1, 4, 6]);
  
    scores = [
      [1, 1, 2, 5, 1],
      [3, 6, 3, 3, 3],
      [5, 5, 1, 2, 2],
      [6, 4, 4, 4, 4],
      [2, 2, 5, 1, 6],
      [4, 3, 6, 6, 5]
    ];
    expect_array_equals('test_equal_sum_majority2', calc_skating(scores), [1, 4, 2, 5, 3, 6]);
  
    scores = [
      [1, 1, 1, 2, 5],
      [2, 4, 5, 1, 2],
      [5, 2, 2, 5, 1],
      [3, 3, 3, 3, 3],
      [4, 5, 4, 4, 4]
    ];
    expect_array_equals('test_equal_sum_majority3', calc_skating(scores), [1, 2, 3, 4, 5]);
  }
  
  function test_shared_places() {
    // rule 8
    let scores = [
      [4, 3, 5, 3, 2],
      [3, 2, 2, 4, 1],
      [2, 1, 1, 5, 4],
      [5, 4, 3, 2, 3],
      [1, 5, 4, 1, 6],
      [6, 6, 6, 6, 5]
    ];
    expect_array_equals('test_shared_places', calc_skating(scores), [3.5, 2, 1, 3.5, 5, 6]);
  
    scores = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1]
    ];
    expect_array_equals('test_shared_places2', calc_skating(scores), [2, 2, 2]);
  
    scores = [
      [1, 1, 3, 3, 4],
      [2, 2, 2, 2, 2],
      [3, 3, 4, 1, 1],
      [4, 4, 1, 4, 3]
    ];
    expect_array_equals('test_shared_places3', calc_skating(scores), [2.5, 1, 2.5, 4]);
  }
  
  function test_final_sums() {
    // rule 9
    let scores = [
      [1, 6, 1, 6, 1],
      [2, 5, 2, 5, 3],
      [3, 4, 3, 4, 4],
      [4, 3, 4, 3, 6],
      [5, 2, 5, 2, 5],
      [6, 1, 6, 1, 2]
    ];
    expect_array_equals('test_final_sums', calc_skating_final(scores), [1, 3, 4, 6, 5, 2]);
  }
  
  function test_final_eqaul_sums() {
    // rule 10
    let scores = [
      [5, 5.5, 2, 5],
      [4, 3.5, 6, 4],
      [2, 2  , 3, 1],
      [3, 1  , 1, 3],
      [1, 5.5, 4, 6],
      [6, 3.5, 5, 2],
    ];
    expect_array_equals('test_final_eqaul_sums', calc_skating_final(scores), [6, 5, 2, 1, 3, 4]);
  
    scores = [
      [1, 5, 6, 1],
      [2, 3, 2, 6],
      [6, 1, 4, 2],
      [5, 2, 3, 3],
      [4, 6, 1, 5],
      [3, 4, 5, 4],
    ];
    expect_array_equals('test_final_eqaul_sums2', calc_skating_final(scores), [1, 3, 2, 4, 6, 5]);
  }
  
  function test_final_eqaul_sums_all_dances() {
    // rule 11
    let allDancesScores = [
      [2, 6, 4, 4, 5, 6, 6, 6, 6, 6, 1, 4, 4, 5, 4, 5, 4, 3, 3, 6],
      [3, 5, 2, 1, 1, 4, 3, 2, 2, 1, 5, 1, 5, 2, 2, 1, 6, 2, 6, 2],
      [5, 2, 5, 2, 2, 2, 2, 1, 3, 5, 2, 5, 2, 1, 2, 2, 5, 1, 5, 1],
      [4, 4, 1, 6, 6, 5, 5, 5, 5, 2, 4, 6, 6, 4, 6, 6, 3, 6, 4, 4],
      [1, 1, 3, 5, 4, 3, 1, 3, 1, 3, 3, 2, 3, 6, 5, 4, 2, 4, 2, 3],
      [6, 3, 6, 3, 3, 1, 4, 4, 4, 4, 6, 3, 1, 3, 3, 3, 1, 5, 1, 5]
    ];
  
    let scores = [
      [6, 6, 5, 5],
      [1, 1, 2, 2],
      [2, 2, 1, 1],
      [5, 5, 6, 6],
      [3, 3, 4, 4],
      [4, 4, 3, 3]
    ];
    expect_array_equals('test_final_eqaul_sums_all_dances', calc_skating_final(scores, allDancesScores), [5, 2, 1, 6, 3, 4]);
  }
  
  function test_final_eqaul_sums_all_dances2() {
    let allDancesScores = [
      [4, 5, 1, 1, 2, 5, 6, 1, 2, 2, 3, 1, 3, 1, 3, 2, 1, 5, 2, 4],
      [1, 1, 2, 5, 6, 1, 2, 2, 5, 5, 6, 6, 1, 2, 2, 3, 3, 3, 1, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 2, 2, 5, 6, 1, 2, 2, 3, 3],
      [5, 4, 5, 2, 1, 2, 5, 5, 1, 6, 5, 5, 6, 4, 1, 6, 6, 4, 4, 1],
      [6, 6, 6, 6, 5, 6, 1, 6, 6, 1, 4, 3, 4, 3, 4, 4, 4, 1, 5, 6],
      [2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 2, 4, 5, 6, 5, 5, 5, 6, 6, 5]
    ];
    let scores = [
      [1, 2, 3, 2],
      [2, 1, 2, 3],
      [3, 3, 1, 1],
      [5, 5, 5, 5],
      [6, 6, 4, 4],
      [4, 4, 6, 6]
    ];
    expect_array_equals('test_final_eqaul_sums_all_dances2', calc_skating_final(scores, allDancesScores), [2, 3, 1, 6, 5, 4]);
  }
  
  function tests() {
    test_calc_majority();
    test_clear_majority();
    test_multiple_majority();
    test_no_majority();
    test_equal_sum_majority();
    test_shared_places();
    test_final_sums();
    test_final_eqaul_sums();
    test_final_eqaul_sums_all_dances();
    test_final_eqaul_sums_all_dances2();
  }
  